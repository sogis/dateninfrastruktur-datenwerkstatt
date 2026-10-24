import {afterEach, describe, expect, it, vi} from 'vitest';
import {BrowserWorkspaceLock} from '../../src/infrastructure/browser/workspaceLock';
import {WorkspaceService} from '../../src/application/workspaceService';
import type {WorkspaceLease, WorkspaceLock} from '../../src/application/ports';
import type {WorkspaceId} from '../../src/domain/model';
import {checkedId, emptyWorkspace} from '../../src/domain/workspace';
import {MemoryWorkspaceRepository} from '../../src/infrastructure/storage/memoryRepository';
import {MemoryArtifactStore} from '../../src/infrastructure/storage/artifactStore';

const newId = <K extends string>() => checkedId<K>(crypto.randomUUID());
const now = () => '2026-10-24T12:00:00Z';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}
function lease(workspaceId: WorkspaceId, mode: 'writer' | 'reader' = 'writer'): WorkspaceLease {
  const release = vi.fn(async () => {});
  return mode === 'writer'
    ? {workspaceId, mode, release}
    : {workspaceId, mode, reason: 'lock-held', release};
}
async function setup(artifacts?: MemoryArtifactStore) {
  const repository = new MemoryWorkspaceRepository();
  const document = await repository.create(
    emptyWorkspace(newId<'workspace'>(), 'Projekt A', now()),
  );
  const firstLease = lease(document.workspace.id, 'reader');
  let available = true;
  const lock: WorkspaceLock = {
    get webLocksAvailable() {
      return available;
    },
    acquire: vi.fn<WorkspaceLock['acquire']>().mockResolvedValueOnce(firstLease),
  };
  const service = new WorkspaceService({
    repository,
    lock,
    newId,
    now,
    ...(artifacts ? {artifacts} : {}),
  });
  const reader = await service.open(document.workspace.id);
  return {
    repository,
    document,
    firstLease,
    lock,
    service,
    reader,
    acquire: vi.mocked(lock.acquire),
    setAvailable(value: boolean) {
      available = value;
    },
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('BrowserWorkspaceLock reasons and lease lifetime', () => {
  it('reports unsupported Web Locks without a misleading held-lock reason', async () => {
    vi.stubGlobal('navigator', {});
    const lock = new BrowserWorkspaceLock();
    const result = await lock.acquire(newId<'workspace'>(), new AbortController().signal);
    expect(lock.webLocksAvailable).toBe(false);
    expect(result).toMatchObject({mode: 'reader', reason: 'locks-unavailable'});
    await result.release();
  });

  it('reports an unavailable exclusive lock without stealing or queuing for it', async () => {
    const request = vi.fn(
      async (
        _name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => Promise<void>,
      ) => callback(null),
    );
    vi.stubGlobal('navigator', {locks: {request}});
    const lock = new BrowserWorkspaceLock();
    const id = newId<'workspace'>();
    const result = await lock.acquire(id, new AbortController().signal);
    expect(result).toMatchObject({mode: 'reader', reason: 'lock-held'});
    expect(request).toHaveBeenCalledWith(
      `datenwerkstatt:${id}`,
      {mode: 'exclusive', ifAvailable: true},
      expect.any(Function),
    );
    expect(lock.webLocksAvailable).toBe(true);
    await result.release();
  });

  it('holds a granted lock until release and releases exactly once', async () => {
    let completed = false;
    const request = vi.fn(
      async (
        name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => Promise<void>,
      ) => {
        await callback({name, mode: 'exclusive'});
        completed = true;
      },
    );
    vi.stubGlobal('navigator', {locks: {request}});
    const result = await new BrowserWorkspaceLock().acquire(
      newId<'workspace'>(),
      new AbortController().signal,
    );
    expect(result.mode).toBe('writer');
    expect(completed).toBe(false);
    await result.release();
    await result.release();
    expect(completed).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('keeps request failures as errors and never labels them as another writer', async () => {
    const failure = new DOMException('blocked', 'SecurityError');
    vi.stubGlobal('navigator', {locks: {request: vi.fn().mockRejectedValue(failure)}});
    await expect(
      new BrowserWorkspaceLock().acquire(newId<'workspace'>(), new AbortController().signal),
    ).rejects.toBe(failure);
  });

  it('rejects an already aborted attempt before requesting a lock', async () => {
    const request = vi.fn();
    vi.stubGlobal('navigator', {locks: {request}});
    const controller = new AbortController();
    controller.abort();
    await expect(
      new BrowserWorkspaceLock().acquire(newId<'workspace'>(), controller.signal),
    ).rejects.toMatchObject({name: 'AbortError'});
    expect(request).not.toHaveBeenCalled();
  });

  it('releases a native grant arriving after the attempt was aborted', async () => {
    const ready = deferred<void>();
    let completed = false;
    const request = vi.fn(
      async (
        name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => Promise<void>,
      ) => {
        await ready.promise;
        await callback({name, mode: 'exclusive'});
        completed = true;
      },
    );
    vi.stubGlobal('navigator', {locks: {request}});
    const controller = new AbortController();
    const attempt = new BrowserWorkspaceLock().acquire(newId<'workspace'>(), controller.signal);
    controller.abort();
    ready.resolve();
    await expect(attempt).rejects.toMatchObject({name: 'AbortError'});
    await vi.waitFor(() => expect(completed).toBe(true));
  });
});

describe('WorkspaceService explicit write access attempts', () => {
  it('retains the exact reader and document on held/unavailable outcomes and publishes runtime diagnostics', async () => {
    const s = await setup();
    const snapshot = s.reader.document;
    const changed = vi.fn();
    const unsubscribe = s.reader.subscribeWriteAccess(changed);
    expect(s.reader.getWriteAccessSnapshot()).toBe(s.reader.getWriteAccessSnapshot());
    s.acquire.mockResolvedValueOnce(lease(s.document.workspace.id, 'reader'));
    const held = await s.service.reacquire(s.document.workspace.id, s.reader.sessionId);
    expect(held).toEqual({outcome: 'still-held', session: s.reader});
    expect(s.reader.document).toBe(snapshot);
    expect(s.firstLease.release).not.toHaveBeenCalled();
    expect(s.reader.writeAccess).toEqual({
      reason: 'lock-held',
      webLocksAvailable: true,
      lastAttempt: {outcome: 'still-held', at: now()},
    });
    s.setAvailable(false);
    s.acquire.mockResolvedValueOnce({
      workspaceId: s.document.workspace.id,
      mode: 'reader',
      reason: 'locks-unavailable',
      release: vi.fn(async () => {}),
    });
    expect(await s.service.reacquire(s.document.workspace.id, s.reader.sessionId)).toEqual({
      outcome: 'unavailable',
      session: s.reader,
    });
    expect(s.reader.readOnlyReason).toBe('locks-unavailable');
    expect(s.reader.writeAccess.webLocksAvailable).toBe(false);
    expect(s.reader.writeAccess.lastAttempt?.outcome).toBe('unavailable');
    expect(changed).toHaveBeenCalledTimes(2);
    expect(() => s.reader.describe('blocked')).toThrow(/Browser unterstützt/);
    expect(s.reader.document).toBe(snapshot);
    unsubscribe();
    await s.service.close();
  });

  it('loads the latest revision before promotion and detaches attempt cancellation from the writer lease', async () => {
    const s = await setup();
    const pending = deferred<WorkspaceLease>();
    let acquisitionSignal: AbortSignal | undefined;
    s.acquire.mockImplementationOnce(async (_id, signal) => {
      acquisitionSignal = signal;
      return pending.promise;
    });
    const caller = new AbortController();
    const attempt = s.service.reacquire(s.document.workspace.id, s.reader.sessionId, caller.signal);
    await vi.waitFor(() => expect(s.acquire).toHaveBeenCalledTimes(2));
    const updated = structuredClone(s.document);
    updated.workspace.description = 'Neuester Stand';
    await s.repository.commit(updated, updated.revision);
    const writerLease = lease(s.document.workspace.id);
    pending.resolve(writerLease);
    const result = await attempt;
    expect(result.outcome).toBe('writer');
    if (result.outcome === 'cancelled') throw Error('unexpected cancellation');
    expect(result.session.document.workspace.description).toBe('Neuester Stand');
    expect(result.session.document.revision).toBe(1);
    expect(result.session).not.toBe(s.reader);
    expect(result.session.writeAccess).toEqual({
      reason: null,
      webLocksAvailable: true,
      lastAttempt: {outcome: 'writer', at: now()},
    });
    expect(s.firstLease.release).toHaveBeenCalledTimes(1);
    expect(writerLease.release).not.toHaveBeenCalled();
    caller.abort();
    expect(acquisitionSignal?.aborted).toBe(false);
    expect(await s.service.open(s.document.workspace.id)).toBe(result.session);
    expect(await s.service.reacquire(s.document.workspace.id, result.session.sessionId)).toEqual({
      outcome: 'already-writer',
      session: result.session,
    });
    expect(s.acquire).toHaveBeenCalledTimes(2);
    await s.service.close();
    expect(writerLease.release).toHaveBeenCalledTimes(1);
  });

  it.each(['request', 'metadata', 'integrity', 'close'] as const)(
    'preserves the reader on %s failure and releases a tentative writer',
    async (failureAt) => {
      const artifacts = new MemoryArtifactStore(1024);
      const s = await setup(artifacts);
      const failure = Error(`failed ${failureAt}`);
      const writerLease = lease(s.document.workspace.id);
      if (failureAt === 'request') s.acquire.mockRejectedValueOnce(failure);
      else s.acquire.mockResolvedValueOnce(writerLease);
      if (failureAt === 'metadata') vi.spyOn(s.repository, 'load').mockRejectedValueOnce(failure);
      if (failureAt === 'integrity')
        vi.spyOn(artifacts, 'list').mockImplementationOnce(async function* () {
          throw failure;
        });
      if (failureAt === 'close') vi.spyOn(s.reader, 'close').mockRejectedValueOnce(failure);
      await expect(s.service.reacquire(s.document.workspace.id, s.reader.sessionId)).rejects.toBe(
        failure,
      );
      expect(await s.service.open(s.document.workspace.id)).toBe(s.reader);
      expect(s.reader.readOnly).toBe(true);
      expect(s.reader.writeAccess.lastAttempt?.outcome).toBe('failed');
      expect(writerLease.release).toHaveBeenCalledTimes(failureAt === 'request' ? 0 : 1);
      expect(s.firstLease.release).not.toHaveBeenCalled();
      await s.service.close();
    },
  );

  it('releases a late acquired writer after caller cancellation without replacing the reader', async () => {
    const s = await setup();
    const pending = deferred<WorkspaceLease>();
    s.acquire.mockImplementationOnce(() => pending.promise);
    const caller = new AbortController();
    const attempt = s.service.reacquire(s.document.workspace.id, s.reader.sessionId, caller.signal);
    await vi.waitFor(() => expect(s.acquire).toHaveBeenCalledTimes(2));
    caller.abort();
    const writerLease = lease(s.document.workspace.id);
    pending.resolve(writerLease);
    expect(await attempt).toEqual({outcome: 'cancelled'});
    expect(writerLease.release).toHaveBeenCalledTimes(1);
    expect(await s.service.open(s.document.workspace.id)).toBe(s.reader);
    expect(s.firstLease.release).not.toHaveBeenCalled();
    await s.service.close();
  });

  it.each(['open', 'close'] as const)(
    'cancels promotion immediately on queued %s navigation intent',
    async (navigation) => {
      const s = await setup();
      const other = await s.repository.create(
        emptyWorkspace(newId<'workspace'>(), 'Projekt B', now()),
      );
      const pending = deferred<WorkspaceLease>();
      s.acquire.mockImplementationOnce(() => pending.promise);
      const attempt = s.service.reacquire(s.document.workspace.id, s.reader.sessionId);
      await vi.waitFor(() => expect(s.acquire).toHaveBeenCalledTimes(2));
      const otherLease = lease(other.workspace.id);
      s.acquire.mockResolvedValueOnce(otherLease);
      const navigate =
        navigation === 'open' ? s.service.open(other.workspace.id) : s.service.close();
      const lateLease = lease(s.document.workspace.id);
      pending.resolve(lateLease);
      expect(await attempt).toEqual({outcome: 'cancelled'});
      expect(lateLease.release).toHaveBeenCalledTimes(1);
      const target = await navigate;
      expect(s.firstLease.release).toHaveBeenCalledTimes(1);
      if (navigation === 'open') {
        expect(await s.service.open(other.workspace.id)).toBe(target);
        expect(s.acquire).toHaveBeenCalledTimes(3);
      } else expect(s.acquire).toHaveBeenCalledTimes(2);
      await s.service.close();
    },
  );

  it('cancels a concurrent stale retry instead of requesting a second writer lease', async () => {
    const s = await setup();
    const pending = deferred<WorkspaceLease>();
    s.acquire.mockImplementationOnce(() => pending.promise);
    const first = s.service.reacquire(s.document.workspace.id, s.reader.sessionId);
    const second = s.service.reacquire(s.document.workspace.id, s.reader.sessionId);
    await vi.waitFor(() => expect(s.acquire).toHaveBeenCalledTimes(2));
    pending.resolve(lease(s.document.workspace.id));
    expect((await first).outcome).toBe('writer');
    expect(await second).toEqual({outcome: 'cancelled'});
    expect(s.acquire).toHaveBeenCalledTimes(2);
    await s.service.close();
  });
});

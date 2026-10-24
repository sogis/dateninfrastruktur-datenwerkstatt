import {test, expect} from '../persistentBrowser';

test('SQL workbench: explicit versions, bounded runs, atomic retirement, persistence and archives', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const path = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
    const {service, session, repository} = await sqlHarness();
    const sql = session.getAnalyses(),
      signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('sql');
      session.updateAnalysis(id, {
        code: 'SELECT CAST($jahr AS INTEGER) AS jahr',
        parameters: {jahr: 2025},
      });
      const firstRun = await sql.run(id),
        firstResult = session.document.runs[firstRun]!.resultIds[0]!;
      await sql.keep(firstResult);
      await sql.asDataset(firstResult, 'Gesichert', 'gesichert');
      const versionId = await session.saveSqlVersion(id, 'Basis');
      session.updateAnalysis(id, {code: 'SELECT 42 AS wert', parameters: {}});
      for (let i = 0; i < 30; i++) await sql.run(id);
      const bounded = Object.keys(session.document.runs).length;
      const current = Object.values(session.document.runs).at(-1)!;
      const currentResult = current.resultIds[0]!;
      const commit = repository.commit.bind(repository);
      repository.commit = async () => {
        throw Error('Injected SQL publication failure');
      };
      let failure = '';
      try {
        await sql.run(id);
      } catch (error) {
        failure = String(error);
      }
      repository.commit = commit;
      const intact = await sql.page(currentResult, {offset: 0, size: 100, sort: []}, signal);
      await session.restoreSqlVersion(versionId);
      const restoredRuns = Object.keys(session.document.runs).length;
      const next = await sql.run(id);
      const rows = await sql.page(
        session.document.runs[next]!.resultIds[0]!,
        {offset: 0, size: 100, sort: []},
        signal,
      );
      const exported = await session.exportArchive(
        'with-data',
        {keepTemporary: false, includeExternal: false},
        signal,
      );
      const candidate = await service.getArchive().inspect(exported.blob, signal);
      const imported = await service.importArchive(candidate.id, signal);
      const importedVersion = Object.values(imported.sqlVersions)[0]!;
      const importedKept = Object.values(imported.results).find(
        (result) => result.retention === 'kept',
      )!;
      await service.close();
      const reopened = await service.open(imported.workspace.id);
      const preserved = await reopened
        .getAnalyses()
        .page(importedKept.id, {offset: 0, size: 100, sort: []}, signal);
      return {
        bounded,
        failure,
        intact: intact.rows,
        restoredRuns,
        rows: rows.rows,
        versionCount: Object.keys(imported.sqlVersions).length,
        version: importedVersion,
        originalVersionId: versionId,
        originalAnalysisId: id,
        importedCode: imported.analyses[importedVersion.analysisId]!.code,
        format: imported.formatVersion,
        preserved: preserved.rows,
        runCountBeforeReopen: Object.keys(imported.runs).length,
        runCountAfterReopen: Object.keys(reopened.document.runs).length,
      };
    } finally {
      await service.close();
    }
  });
  expect(proof.bounded).toBe(2);
  expect(proof.failure).toContain('Injected SQL publication failure');
  expect(proof.intact).toEqual([['42']]);
  expect(proof.restoredRuns).toBe(2);
  expect(proof.rows).toEqual([['2025']]);
  expect(proof.versionCount).toBe(1);
  expect(proof.version.name).toBe('Basis');
  expect(proof.version.id).not.toBe(proof.originalVersionId);
  expect(proof.version.analysisId).not.toBe(proof.originalAnalysisId);
  expect(proof.importedCode).toBe(proof.version.code);
  expect(proof.format).toBe(2);
  expect(proof.preserved).toEqual([['2025']]);
  expect(proof.runCountAfterReopen).toBe(proof.runCountBeforeReopen);
});

test('SQL workbench: replacing a result waits for whole payload/chart readers; materialized exports finish', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const path = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
    const {service, session} = await sqlHarness();
    const sql = session.getAnalyses(),
      signal = new AbortController().signal;
    let resume!: () => void;
    let resumeRelease!: () => void;
    try {
      const id = session.createAnalysis('sql');
      session.updateAnalysis(id, {code: 'SELECT i, i * 2 AS value FROM range(1001) t(i)'});
      const run = await sql.run(id),
        resultId = session.document.runs[run]!.resultIds[0]!;
      const oldKey = (await sql.handle(resultId, signal)).key;
      const csv = await sql.export(resultId, 'csv', signal);
      let notifyRelease!: () => void;
      const releaseStarted = new Promise<void>((resolve) => {
        notifyRelease = resolve;
      });
      const releaseHeld = new Promise<void>((resolve) => {
        resumeRelease = resolve;
      });
      const read = sql.sql.readPage.bind(sql.sql),
        release = sql.sql.release.bind(sql.sql);
      let ready!: () => void,
        started = 0,
        released = 0;
      const readersReady = new Promise<void>((resolve) => {
        ready = resolve;
      });
      const held = new Promise<void>((resolve) => {
        resume = resolve;
      });
      sql.sql.readPage = async (handle, request, readSignal) => {
        const page = await read(handle, request, readSignal);
        if (request.offset === 0) {
          if (++started === 2) ready();
          await held;
        }
        return page;
      };
      sql.sql.release = async (handle) => {
        if (handle.key === oldKey) {
          released++;
          notifyRelease();
          await releaseHeld;
        }
        await release(handle);
      };
      const payload = sql.payload(resultId, signal);
      const chart = sql.chartData(resultId, {type: 'line', x: 'i', y: 'value'}, signal);
      await readersReady;
      session.updateAnalysis(id, {code: 'SELECT 9 AS current'});
      await sql.run(id);
      const removed = !session.document.results[resultId];
      const releaseBeforeReaders = released;
      resume();
      await releaseStarted;
      // A further run can reach retirement while the previous reader is still releasing.
      const thirdStarted = new Promise<void>((resolve) => {
        const unsubscribe = session.persistence.subscribe(() => {
          const current = Object.values(session.document.runs).at(-1);
          if (current?.snapshot.code === 'SELECT 10 AS current' && current.status === 'running') {
            unsubscribe();
            resolve();
          }
        });
      });
      session.updateAnalysis(id, {code: 'SELECT 10 AS current'});
      const third = sql.run(id);
      await thirdStarted;
      resumeRelease();
      const [data, graph, finalRun] = await Promise.all([payload, chart, third]);
      sql.sql.readPage = read;
      const exported = await new Response(csv).text();
      return {
        finalStatus: session.document.runs[finalRun]!.status,
        removed,
        releaseBeforeReaders,
        released,
        payloadRows: data.rowCount,
        chartRows: graph.rows.length,
        finalChartRow: graph.rows.at(-1),
        csvLines: exported.trim().split('\n').length,
        runs: Object.keys(session.document.runs).length,
      };
    } finally {
      resume?.();
      resumeRelease?.();
      await service.close();
    }
  });
  expect(proof.finalStatus).toBe('succeeded');
  expect(proof.removed).toBe(true);
  expect(proof.releaseBeforeReaders).toBe(0);
  expect(proof.released).toBe(1);
  expect(proof.payloadRows).toBe(1001);
  expect(proof.chartRows).toBe(1001);
  expect(proof.finalChartRow).toEqual(['1000', '2000']);
  expect(proof.csvLines).toBe(1002);
  expect(proof.runs).toBe(1);
});

test('SQL format break: old IndexedDB rows do not block listing, creating or abandoned-file cleanup', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const rp = '/src/infrastructure/storage/workspaceRepository.ts',
      dp = '/src/domain/workspace.ts';
    const ap = '/src/infrastructure/storage/artifactStore.ts',
      cp = '/src/application/recoveryService.ts';
    const {WorkspaceDatabase, DexieWorkspaceRepository} = (await import(
      rp
    )) as typeof import('../../src/infrastructure/storage/workspaceRepository');
    const {checkedId, emptyWorkspace} = (await import(
      dp
    )) as typeof import('../../src/domain/workspace');
    const {MemoryArtifactStore} = (await import(
      ap
    )) as typeof import('../../src/infrastructure/storage/artifactStore');
    const {RecoveryService} = (await import(
      cp
    )) as typeof import('../../src/application/recoveryService');
    const db = new WorkspaceDatabase(`format-break-${crypto.randomUUID()}`),
      repo = new DexieWorkspaceRepository(db);
    const id = () => checkedId<'workspace'>(crypto.randomUUID()),
      signal = new AbortController().signal;
    const oldId = id(),
      current = emptyWorkspace(id(), 'Aktuell', new Date().toISOString());
    const old = {...emptyWorkspace(oldId, 'Alt', new Date().toISOString()), formatVersion: 1};
    const artifacts = new MemoryArtifactStore(1024);
    try {
      await db.workspaces.add({
        id: oldId,
        name: 'Alt',
        updatedAt: old.workspace.updatedAt,
        document: old,
      });
      await repo.create(current);
      const listed = await repo.list();
      let rejected = '';
      try {
        await repo.load(oldId);
      } catch (error) {
        rejected = String(error);
      }
      const oldFile = await artifacts.write(
        oldId,
        new Blob(['old']).stream(),
        'text/plain',
        signal,
      );
      const orphan = await artifacts.write(
        id(),
        new Blob(['orphan']).stream(),
        'text/plain',
        signal,
      );
      const cleanup = await new RecoveryService(artifacts).cleanAbandoned(
        repo,
        {acquire: async (workspaceId) => ({workspaceId, mode: 'writer', release: async () => {}})},
        signal,
      );
      return {
        listed: listed.map((item) => item.name),
        rejected,
        oldUnchanged: (await db.workspaces.get(oldId))?.document,
        old,
        oldFilePreserved: await artifacts.exists(oldFile),
        orphanRemoved: !(await artifacts.exists(orphan)),
        removed: cleanup.removed.length,
      };
    } finally {
      await db.delete();
    }
  });
  expect(proof.listed).toEqual(['Aktuell']);
  expect(proof.rejected).toContain('Projektformat nicht unterstützt');
  expect(proof.oldUnchanged).toEqual(proof.old);
  expect(proof.oldFilePreserved).toBe(true);
  expect(proof.orphanRemoved).toBe(true);
  expect(proof.removed).toBe(1);
});

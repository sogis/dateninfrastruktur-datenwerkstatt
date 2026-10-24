import {expect, it, vi} from 'vitest';
import {checkedId, emptyWorkspace, parseWorkspace} from '../../src/domain/workspace';
import {assertImmutableHistory} from '../../src/domain/immutability';
import {obsoleteSqlRuns, pruneSqlRuns} from '../../src/domain/sqlRetention';
import {WorkspaceEditingSession} from '../../src/application/workspaceService';
import {MemoryWorkspaceRepository} from '../../src/infrastructure/storage/memoryRepository';
import {remapWorkspace} from '../../src/domain/remap';
import type {AnalysisId, ExecutionRun, WorkspaceDocument} from '../../src/domain/model';
const newId = <K extends string>() => checkedId<K>(crypto.randomUUID());
const now = () => '2026-10-24T20:00:00Z';
async function setup() {
  const repository = new MemoryWorkspaceRepository();
  const document = await repository.create(emptyWorkspace(newId<'workspace'>(), 'SQL', now()));
  const session = new WorkspaceEditingSession(
    document,
    {workspaceId: document.workspace.id, mode: 'writer', release: async () => {}},
    {
      repository,
      newId,
      now,
      lock: {
        acquire: async () => {
          throw Error('unused');
        },
      },
    },
  );
  return {session, repository};
}
function addRun(d: WorkspaceDocument, analysisId: AnalysisId) {
  const id = newId<'run'>(),
    resultId = newId<'result'>();
  const language = d.analyses[analysisId]!.kind;
  const run: ExecutionRun = {
    id,
    workspaceId: d.workspace.id,
    trigger: 'analysis',
    status: 'succeeded',
    queuedAt: now(),
    finishedAt: now(),
    warnings: [],
    resultIds: [resultId],
    snapshot: {
      analysisId,
      language,
      code: 'SELECT 1',
      parameters: {},
      resolvedInputs: [],
      inputScope: 'workspace-snapshot',
      provenance: 'declared-inputs',
      notes: [],
      runtime: {
        appBuildId: 'test',
        engineId: language === 'sql' ? 'duckdb-local' : 'webr-local',
        engineVersion: 'test',
        transferCodecVersion: '1',
        timeZone: 'UTC',
      },
    },
  };
  d.runs[id] = run;
  d.results[resultId] = {
    id: resultId,
    runId: id,
    workspaceId: d.workspace.id,
    kind: 'table',
    name: 'Ergebnis',
    createdAt: now(),
    retention: 'temporary',
    materialization: {kind: 'unavailable', reason: 'session-ended'},
    schema: {columns: [], metadata: {}},
    rowCount: '1',
    coverage: {kind: 'complete'},
  };
  return {run, result: d.results[resultId]!};
}
it('only explicit versions survive draft edits; restore, rename and duplication preserve their contracts', async () => {
  const {session: s, repository} = await setup();
  try {
    const id = s.createAnalysis('sql');
    s.updateAnalysis(id, {code: 'SELECT $jahr', parameters: {jahr: 2025}});
    await s.flush();
    expect(Object.keys(s.document.sqlVersions)).toHaveLength(0);
    const versionId = await s.saveSqlVersion(id, '  Basis  ');
    const version = structuredClone(s.document.sqlVersions[versionId]!);
    s.updateAnalysis(id, {code: 'SELECT 2', parameters: {jahr: 2026}});
    await s.flush();
    expect(s.document.sqlVersions[versionId]).toEqual(version);
    const revision = s.document.analyses[id]!.revision;
    await s.renameAnalysis(id, 'Öffentliche Analyse');
    expect(s.document.analyses[id]!.revision).toBe(revision);
    await s.restoreSqlVersion(versionId);
    expect(s.document.analyses[id]).toMatchObject({
      name: 'Öffentliche Analyse',
      code: 'SELECT $jahr',
      parameters: {jahr: 2025},
    });
    expect(Object.keys(s.document.runs)).toHaveLength(0);
    const copy = s.duplicateAnalysis(id);
    await s.flush();
    expect(Object.values(s.document.sqlVersions).some((v) => v.analysisId === copy)).toBe(false);
    const cloned = remapWorkspace(s.document, new Map(), newId, now());
    const clonedVersion = Object.values(cloned.sqlVersions)[0]!;
    expect(clonedVersion.id).not.toBe(versionId);
    expect(clonedVersion.analysisId).not.toBe(id);
    expect(cloned.analyses[clonedVersion.analysisId]!.code).toBe(version.code);
    expect(clonedVersion.name).toBe('Basis');
    s.archiveAnalysis(id);
    await s.flush();
    expect((await repository.load(s.document.workspace.id))!.sqlVersions[versionId]).toEqual(
      version,
    );
    const bad = structuredClone(s.document);
    bad.sqlVersions[versionId]!.code = 'SELECT 999';
    expect(() => assertImmutableHistory(s.document, bad)).toThrow();
    await expect(s.restoreSqlVersion(versionId)).rejects.toThrow();
  } finally {
    await s.close();
  }
});
it('version publication freezes the clicked draft; commit errors publish neither versions nor renamed/restored drafts', async () => {
  const {session: s, repository} = await setup();
  try {
    const id = s.createAnalysis('sql');
    await s.flush();
    const commit = vi.spyOn(repository, 'commit');
    commit.mockRejectedValueOnce(Error('disk full'));
    await expect(s.saveSqlVersion(id, 'Basis')).rejects.toThrow('disk full');
    expect(s.document.sqlVersions).toEqual({});
    const versionId = await s.saveSqlVersion(id, 'Basis');
    s.updateAnalysis(id, {code: 'SELECT 99'});
    await s.flush();
    const before = structuredClone(s.document);
    commit.mockRejectedValueOnce(Error('disk full'));
    await expect(s.renameAnalysis(id, 'Anders')).rejects.toThrow('disk full');
    expect(s.document).toEqual(before);
    commit.mockRejectedValueOnce(Error('disk full'));
    await expect(s.restoreSqlVersion(versionId)).rejects.toThrow('disk full');
    expect(s.document).toEqual(before);
    const pending = s.saveSqlVersion(id, 'Geklickter Stand');
    s.updateAnalysis(id, {code: 'SELECT 100'});
    const captured = await pending;
    expect(s.document.sqlVersions[captured]!.code).toBe('SELECT 99');
    expect(s.document.analyses[id]!.code).toBe('SELECT 100');
  } finally {
    await s.close();
  }
});
it('1000 work runs collapse to current; protected provenance and every R run remain immutable', async () => {
  const {session: s} = await setup();
  try {
    const sql = s.createAnalysis('sql'),
      r = s.createAnalysis('r');
    const d = structuredClone(s.document);
    const first = addRun(d, sql),
      second = addRun(d, sql);
    second.run.snapshot.resolvedInputs.push({
      kind: 'result',
      bindingName: 'input',
      usage: 'bound',
      resultId: first.result.id,
    });
    const rRun = addRun(d, r);
    rRun.run.snapshot.resolvedInputs.push({
      kind: 'result',
      bindingName: 'input',
      usage: 'bound',
      resultId: second.result.id,
    });
    for (let i = 0; i < 1000; i++) addRun(d, sql);
    Object.assign(d, parseWorkspace(d));
    const before = structuredClone(d);
    pruneSqlRuns(d, sql);
    expect(Object.keys(d.runs)).toHaveLength(4);
    expect(d.runs[first.run.id]).toEqual(first.run);
    expect(d.runs[second.run.id]).toEqual(second.run);
    expect(d.runs[rRun.run.id]).toEqual(rRun.run);
    expect(obsoleteSqlRuns(d)).toEqual([]);
    expect(() => parseWorkspace(d)).not.toThrow();
    expect(() => assertImmutableHistory(before, d)).not.toThrow();
    const bad = structuredClone(d);
    delete bad.runs[first.run.id];
    delete bad.results[first.result.id];
    expect(() => assertImmutableHistory(d, bad)).toThrow();
  } finally {
    await s.close();
  }
});
it.each(['kept', 'artifact', 'dataset', 'analysis', 'chart'] as const)(
  '%s protects an older SQL result',
  async (root) => {
    const {session: s} = await setup();
    try {
      const id = s.createAnalysis('sql'),
        d = structuredClone(s.document);
      const old = addRun(d, id);
      addRun(d, id);
      const artifactId = newId<'artifact'>();
      if (root === 'kept') old.result.retention = 'kept';
      if (root === 'artifact') old.result.materialization = {kind: 'artifact', artifactId};
      if (root === 'analysis')
        d.analyses[id]!.inputs.push({
          name: 'input',
          source: {kind: 'result', resultId: old.result.id},
        });
      if (root === 'chart') {
        const chartId = newId<'visualization'>();
        d.visualizations[chartId] = {
          id: chartId,
          workspaceId: d.workspace.id,
          name: 'Chart',
          tableResultId: old.result.id,
          spec: {type: 'bar', x: 'x', y: 'y'},
        };
      }
      if (root === 'dataset') {
        const versionId = newId<'dataset-version'>();
        d.datasetVersions[versionId] = {
          id: versionId,
          workspaceId: d.workspace.id,
          datasetId: newId<'dataset'>(),
          origin: {kind: 'result', resultId: old.result.id},
          backing: {kind: 'missing', reason: 'recipe-import'},
          evidence: {kind: 'unverified'},
          schema: {columns: [], metadata: {}},
          createdAt: now(),
        };
      }
      // This is the graph planner's deliberately partial input, not a published workspace.
      expect(obsoleteSqlRuns(d)).toEqual([]);
    } finally {
      await s.close();
    }
  },
);
it('rejects format 1 with no migration/default versions collection', () => {
  const d = emptyWorkspace(newId<'workspace'>(), 'New', now());
  expect(() => parseWorkspace({...d, formatVersion: 1})).toThrow(
    expect.objectContaining({code: 'FORMAT_UNSUPPORTED'}),
  );
  const {sqlVersions: _versions, ...incomplete} = d;
  expect(() => parseWorkspace(incomplete)).toThrow();
});

it('read-only sessions can inspect versions but cannot rename, save or restore them', async () => {
  const {session: writer, repository} = await setup();
  try {
    const id = writer.createAnalysis('sql');
    const version = await writer.saveSqlVersion(id, 'Basis');
    const before = structuredClone(writer.document);
    const reader = new WorkspaceEditingSession(
      before,
      {
        workspaceId: before.workspace.id,
        mode: 'reader',
        reason: 'lock-held',
        release: async () => {},
      },
      {
        repository,
        newId,
        now,
        lock: {
          acquire: async () => {
            throw Error('unused');
          },
        },
      },
    );
    try {
      await expect(reader.renameAnalysis(id, 'Anders')).rejects.toMatchObject({
        code: 'READ_ONLY_WORKSPACE',
      });
      await expect(reader.saveSqlVersion(id, 'Weitere')).rejects.toMatchObject({
        code: 'READ_ONLY_WORKSPACE',
      });
      await expect(reader.restoreSqlVersion(version)).rejects.toMatchObject({
        code: 'READ_ONLY_WORKSPACE',
      });
      expect(reader.document).toEqual(before);
    } finally {
      await reader.close();
    }
  } finally {
    await writer.close();
  }
});

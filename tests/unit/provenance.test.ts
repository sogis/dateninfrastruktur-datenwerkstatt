import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import recipe from '../../fixtures/workspace.recipe.json';
import {checkedId, parseWorkspace} from '../../src/domain/workspace';
import type {ExecutionRun, TableResult} from '../../src/domain/model';
import {RunDetails, runStatusText, runTimeText} from '../../src/features/results/RunDetails';
import type {DatasetAvailabilityContext} from '../../src/features/data/DatasetHistory';

function projectWithRun() {
  const workspaceDocument = parseWorkspace(recipe);
  const analysis = Object.values(workspaceDocument.analyses).find((item) => item.kind === 'sql')!;
  const dataset = Object.values(workspaceDocument.datasets)[0]!;
  const version = workspaceDocument.datasetVersions[dataset.currentVersionId]!;
  const artifactId = checkedId<'artifact'>('00000000-0000-4000-8000-000000000001');
  workspaceDocument.artifacts[artifactId] = {
    id: artifactId,
    workspaceId: workspaceDocument.workspace.id,
    path: `workspaces/${workspaceDocument.workspace.id}/artifacts/${artifactId}.parquet`,
    mediaType: 'application/vnd.apache.parquet',
    bytes: 256,
    sha256: '0'.repeat(64),
    createdAt: '2026-10-15T10:00:00.123Z',
  };
  version.backing = {kind: 'artifact', artifactId};
  const runId = checkedId<'run'>('00000000-0000-4000-8000-000000000002');
  const resultId = checkedId<'result'>('00000000-0000-4000-8000-000000000003');
  const run: ExecutionRun = {
    id: runId,
    workspaceId: workspaceDocument.workspace.id,
    trigger: 'analysis',
    snapshot: {
      analysisId: analysis.id,
      analysisRevision: analysis.revision,
      language: 'sql',
      code: 'SELECT CAST($wert AS DECIMAL(38,18)) AS exakt',
      parameters: {wert: {type: 'decimal', value: '12345678901234567890.123456789012345678'}},
      resolvedInputs: [
        {
          kind: 'dataset-version',
          bindingName: dataset.sqlName,
          datasetId: dataset.id,
          versionId: version.id,
          usage: 'possibly-used',
        },
      ],
      inputScope: 'workspace-snapshot',
      provenance: 'declared-inputs',
      runtime: {
        appBuildId: 'unit-render',
        engineId: 'duckdb-local',
        engineVersion: 'test-version',
        transferCodecVersion: '1',
        timeZone: 'UTC',
      },
      notes: [],
    },
    status: 'succeeded',
    queuedAt: '2026-10-15T10:00:00.123Z',
    startedAt: '2026-10-15T10:00:00.123Z',
    finishedAt: '2026-10-15T10:00:00.123Z',
    durationMs: 0,
    warnings: [],
    resultIds: [resultId],
  };
  const result: TableResult = {
    id: resultId,
    runId,
    workspaceId: workspaceDocument.workspace.id,
    kind: 'table',
    name: 'Genaues Ergebnis',
    createdAt: '2026-10-15T10:00:00.123Z',
    retention: 'kept',
    materialization: {kind: 'artifact', artifactId},
    schema: {
      columns: [
        {name: 'exakt', logicalType: 'DECIMAL(38,18)', nullable: false, roles: [], metadata: {}},
      ],
      metadata: {},
    },
    rowCount: '9007199254740993',
    coverage: {kind: 'complete'},
  };
  workspaceDocument.runs[run.id] = run;
  workspaceDocument.results[result.id] = result;
  return {workspaceDocument, run, result, dataset, version, analysis, artifactId};
}

function renderRun(
  project: ReturnType<typeof projectWithRun>,
  availability?: DatasetAvailabilityContext,
) {
  const props = availability
    ? {run: project.run, workspaceDocument: project.workspaceDocument, availability}
    : {run: project.run, workspaceDocument: project.workspaceDocument};
  const html = renderToStaticMarkup(createElement(RunDetails, props));
  return {html, readable: html.split('<details class="run-technical">')[0]!};
}

describe('Project provenance presentation', () => {
  it('distinguishes SQL availability from actual usage and preserves exact values without mutating the project', () => {
    const project = projectWithRun();
    project.analysis.archivedAt = '2026-10-15T11:00:00Z';
    project.dataset.removedAt = '2026-10-15T11:00:00Z';
    const revision = JSON.stringify(project.workspaceDocument);
    const {html, readable} = renderRun(project);
    expect(html).toMatch(/^<details class="run-details">/);
    expect(readable).toContain('SQL-Projektsnapshot');
    expect(readable).toContain(
      'bedeutet nicht, dass die Abfrage diese Quelle tatsächlich gelesen hat',
    );
    expect(readable).toContain('Möglicherweise verwendet');
    expect(readable).toContain('(archiviert)');
    expect(readable).toContain('(entfernt)');
    expect(readable).toContain('9007199254740993 Zeilen');
    expect(readable).toContain('<code>12345678901234567890.123456789012345678</code>');
    expect(readable).toContain('0 ms');
    expect(readable).toContain('2026-10-15 10:00:00.123 UTC');
    expect(readable).not.toContain(project.run.id);
    expect(readable).not.toContain('test-version');
    expect(JSON.stringify(project.workspaceDocument)).toBe(revision);
  });

  it('does not claim local bytes exist merely because artifact metadata exists', () => {
    const {readable} = renderRun(projectWithRun());
    expect(readable.match(/Lokale Datei · Verfügbarkeit noch ungeprüft/g)).toHaveLength(2);
    expect(readable).not.toContain('Lokal gesichert');
  });

  it.each([
    {state: 'missing', message: 'Nicht verfügbar · Datei fehlt'},
    {state: 'corrupt', message: 'Nicht verfügbar · Datei beschädigt'},
  ] as const)('shows known $state bytes for inputs and retained results', ({state, message}) => {
    const project = projectWithRun();
    const {readable} = renderRun(project, {
      mode: 'persistent',
      missingArtifacts: undefined,
      hashesChecked: true,
      integrity: {
        referenced: [project.artifactId],
        missing: state === 'missing' ? [project.artifactId] : [],
        corrupt: state === 'corrupt' ? [project.artifactId] : [],
        orphanPaths: [],
      },
    });
    expect(readable.split(message)).toHaveLength(3);
    expect(readable).not.toContain('Hash in dieser Sitzung geprüft');
  });

  it('presents direct R captures without inventing an analysis or a former script run', () => {
    const project = projectWithRun();
    project.run.trigger = 'r-object-capture';
    project.run.snapshot.language = 'r';
    delete project.run.snapshot.analysisId;
    delete project.run.snapshot.analysisRevision;
    project.run.snapshot.code = '';
    project.run.snapshot.inputScope = 'session-capture';
    project.run.snapshot.provenance = 'session-dependent';
    project.run.snapshot.resolvedInputs = [];
    project.run.snapshot.notes = ['Scope private-scope-id, R-Epoche 17'];
    const {html, readable} = renderRun(project);
    expect(readable).toContain('Direkte R-Objektübernahme ohne gespeicherte Analyse');
    expect(readable).toContain('Er führt das Skript nicht erneut aus');
    expect(readable).toContain('keiner früheren Skriptausführung');
    expect(readable).not.toContain('private-scope-id');
    expect(html).toContain('private-scope-id');
  });

  it('keeps known missing bytes unavailable when an inventory has no missing entries', () => {
    const project = projectWithRun();
    const {readable} = renderRun(project, {
      mode: 'persistent',
      missingArtifacts: [],
      hashesChecked: true,
      integrity: {
        referenced: [project.artifactId],
        missing: [project.artifactId],
        corrupt: [],
        orphanPaths: [],
      },
    });
    expect(readable.split('Nicht verfügbar · Datei fehlt')).toHaveLength(3);
    expect(readable).not.toContain('Hash in dieser Sitzung geprüft');
  });

  it('uses explicit bound labels and exposes unavailable recipe results without materializing them', () => {
    const project = projectWithRun();
    project.run.snapshot.resolvedInputs[0]!.usage = 'bound';
    project.run.snapshot.inputScope = 'explicit-bindings';
    project.result.materialization = {kind: 'unavailable', reason: 'recipe-import'};
    const {readable} = renderRun(project);
    expect(readable).toContain('Explizit gebunden');
    expect(readable).not.toContain('SQL-Projektsnapshot');
    expect(readable).toContain('Projektdatei enthält keine Ergebnisdaten');
    expect(runStatusText(project.run)).toBe('Erfolgreich');
    expect(runTimeText(project.run.queuedAt)).toBe('2026-10-15 10:00:00.123 UTC');
  });
});

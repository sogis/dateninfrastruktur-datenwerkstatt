import type {WorkspaceDocument} from './model';
import {WorkspaceValidationError} from './workspace';
import {obsoleteSqlRuns} from './sqlRetention';
function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function assertImmutableHistory(before: WorkspaceDocument, after: WorkspaceDocument) {
  function require(condition: boolean, path: string) {
    if (!condition)
      throw new WorkspaceValidationError(
        'VALIDATION_FAILED',
        'Historischer Inhalt darf nicht verändert werden.',
        path,
      );
  }
  require(before.workspace.id === after.workspace.id, 'workspace.id');
  const removable = new Set(
    obsoleteSqlRuns({
      ...after,
      runs: {...before.runs, ...after.runs},
      results: {...before.results, ...after.results},
    }),
  );
  for (const [id, version] of Object.entries(before.datasetVersions))
    require(same(
      version,
      after.datasetVersions[id as keyof typeof after.datasetVersions],
    ), `datasetVersions.${id}`);
  for (const [id, artifact] of Object.entries(before.artifacts))
    require(same(artifact, after.artifacts[id as keyof typeof after.artifacts]), `artifacts.${id}`);
  for (const [id, run] of Object.entries(before.runs)) {
    const next = after.runs[id as keyof typeof after.runs];
    if (!next && removable.has(run.id)) continue;
    require(!!next, `runs.${id}`);
    require(same(run.snapshot, next?.snapshot), `runs.${id}.snapshot`);
    if (['succeeded', 'failed', 'cancelled', 'interrupted'].includes(run.status))
      require(same(run, next), `runs.${id}`);
  }
  for (const [id, result] of Object.entries(before.results)) {
    const next = after.results[id as keyof typeof after.results];
    if (!next && !after.runs[result.runId] && removable.has(result.runId)) continue;
    const {retention: _retention, materialization: _materialization, ...content} = result;
    const {
      retention: _nextRetention,
      materialization: _nextMaterialization,
      ...nextContent
    } = next ?? {};
    require(same(content, nextContent), `results.${id}`);
  }
  for (const [id, dataset] of Object.entries(before.datasets))
    require(after.datasets[id as keyof typeof after.datasets]?.sqlName ===
      dataset.sqlName, `datasets.${id}.sqlName`);
}

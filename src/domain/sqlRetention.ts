import type {AnalysisId, RunId, WorkspaceDocument} from './model';

const terminal = new Set(['succeeded', 'failed', 'cancelled', 'interrupted']);

export function latestSqlRun(workspace: WorkspaceDocument, analysisId: AnalysisId) {
  return Object.values(workspace.runs)
    .reverse()
    .find((run) => run.snapshot.language === 'sql' && run.snapshot.analysisId === analysisId);
}

/** Only obsolete SQL work runs may disappear; every retained result keeps its provenance. */
export function obsoleteSqlRuns(workspace: WorkspaceDocument, analysisId?: AnalysisId): RunId[] {
  const protectedRuns = new Set<RunId>();
  const pending: RunId[] = [];
  const protectRun = (id: RunId) => {
    if (!protectedRuns.has(id)) {
      protectedRuns.add(id);
      pending.push(id);
    }
  };
  const protectResult = (id: keyof WorkspaceDocument['results']) => {
    const result = workspace.results[id];
    if (result) protectRun(result.runId);
  };
  const latest = new Map<AnalysisId, RunId>();
  for (const run of Object.values(workspace.runs)) {
    if (run.snapshot.language === 'r' || !terminal.has(run.status)) protectRun(run.id);
    if (run.snapshot.language === 'sql' && run.snapshot.analysisId)
      latest.set(run.snapshot.analysisId, run.id);
  }
  for (const id of latest.values()) protectRun(id);
  for (const result of Object.values(workspace.results))
    if (result.retention === 'kept' || result.materialization.kind === 'artifact')
      protectResult(result.id);
  for (const version of Object.values(workspace.datasetVersions))
    if (version.origin.kind === 'result') protectResult(version.origin.resultId);
  for (const analysis of Object.values(workspace.analyses))
    for (const input of analysis.inputs)
      if (input.source.kind === 'result') protectResult(input.source.resultId);
  for (const chart of Object.values(workspace.visualizations)) protectResult(chart.tableResultId);
  for (let index = 0; index < pending.length; index++) {
    const run = workspace.runs[pending[index]!];
    if (!run) continue;
    for (const input of run.snapshot.resolvedInputs)
      if (input.kind === 'result') protectResult(input.resultId);
  }
  return Object.values(workspace.runs)
    .filter(
      (run) =>
        run.snapshot.language === 'sql' &&
        terminal.has(run.status) &&
        (!analysisId || run.snapshot.analysisId === analysisId) &&
        !protectedRuns.has(run.id),
    )
    .map((run) => run.id);
}

export function pruneSqlRuns(workspace: WorkspaceDocument, analysisId: AnalysisId) {
  for (const id of obsoleteSqlRuns(workspace, analysisId)) {
    for (const resultId of workspace.runs[id]!.resultIds) delete workspace.results[resultId];
    delete workspace.runs[id];
  }
}

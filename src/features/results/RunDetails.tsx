import type {
  ExecutionRun,
  ParameterValue,
  ResolvedTableInput,
  Result,
  WorkspaceDocument,
} from '../../domain/model';
import {datasetAvailability, type DatasetAvailabilityContext} from '../data/DatasetHistory';

const uncheckedAvailability: DatasetAvailabilityContext = {
  mode: 'persistent',
  missingArtifacts: undefined,
  integrity: undefined,
  hashesChecked: false,
};

export function runStatusText(run: ExecutionRun) {
  return {
    queued: 'Ausführung wartet',
    running: 'Ausführung läuft',
    cancelling: 'Ausführung wird beendet',
    succeeded: 'Ausführung erfolgreich',
    failed: 'Ausführung fehlgeschlagen',
    cancelled: 'Ausführung abgebrochen',
    interrupted: 'Ausführung unterbrochen',
  }[run.status];
}

export function RunStatus({
  run,
  busy,
}: {
  run?: ExecutionRun | undefined;
  busy?: string | undefined;
}) {
  return (
    <div className="run-summary" role="status" aria-live="polite">
      <span className="run-summary-message">{busy ?? (run ? runStatusText(run) : 'Bereit')}</span>
      {run && (
        <dl className="dw-meta-list">
          {run.snapshot.language !== 'sql' && (
            <div>
              <dt>Revision</dt>
              <dd>{run.snapshot.analysisRevision ?? 'nicht angegeben'}</dd>
            </div>
          )}
          <div>
            <dt>Laufzeit</dt>
            <dd>{run.durationMs === undefined ? 'noch nicht erfasst' : `${run.durationMs} ms`}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export function runOptionText(run: ExecutionRun) {
  return `${runStatusText(run)} vom ${runTimeText(run.queuedAt)} (Revision ${run.snapshot.analysisRevision ?? 'nicht angegeben'})`;
}

/** Preserve the recorded instant, including fractional seconds, and state its time zone. */
export function runTimeText(value: string) {
  return value.replace('T', ' ').replace(/Z$/, ' UTC');
}

function parameterType(value: ParameterValue) {
  if (value === null) return 'NULL';
  if (typeof value === 'object') return value.type;
  if (typeof value === 'string') return 'Text';
  return typeof value === 'number' ? 'Zahl' : 'Boolesch';
}

function parameterText(value: ParameterValue) {
  if (value === null) return 'NULL';
  if (typeof value === 'object') return value.value;
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function resultExtent(result: Result) {
  return result.kind === 'plot'
    ? `PNG-Grafik mit ${result.width} × ${result.height} Pixeln.`
    : `Tabelle mit ${result.rowCount} Zeilen und ${result.schema.columns.length} Spalten. ${result.coverage.kind === 'complete' ? 'Das Ergebnis ist vollständig.' : 'Das Ergebnis ist begrenzt; die ursprüngliche Gesamtzahl ist unbekannt.'}`;
}

function resultAvailability(
  result: Result,
  workspaceDocument: WorkspaceDocument,
  context: DatasetAvailabilityContext,
) {
  const materialization = result.materialization;
  if (materialization.kind === 'session') return 'Nur in dieser Sitzung verfügbar';
  if (materialization.kind === 'artifact') {
    const artifactId = materialization.artifactId;
    if (!workspaceDocument.artifacts[artifactId])
      return 'Nicht verfügbar, da der Dateieintrag fehlt.';
    if (context.integrity?.corrupt.includes(artifactId))
      return 'Nicht verfügbar, da die Datei beschädigt ist.';
    if (
      context.missingArtifacts?.includes(artifactId) ||
      context.integrity?.missing.includes(artifactId)
    )
      return 'Nicht verfügbar, da die Datei fehlt.';
    if (context.mode === 'temporary') return 'Nur diese Sitzung';
    if (context.hashesChecked && context.integrity?.referenced.includes(artifactId))
      return 'Die Datei ist lokal vorhanden. Ihr Hash wurde in dieser Sitzung geprüft.';
    if (context.missingArtifacts || context.integrity?.referenced.includes(artifactId))
      return 'Die Datei ist lokal vorhanden. Ihr Hash wurde in dieser Sitzung noch nicht geprüft.';
    return 'Die Verfügbarkeit der lokalen Datei wurde noch nicht geprüft.';
  }
  return `Nicht verfügbar: ${
    {
      'session-ended': 'Sitzung beendet',
      'runtime-reset': 'Laufzeit zurückgesetzt',
      'missing-artifact': 'Datei fehlt',
      'recipe-import': 'Projektdatei enthält keine Ergebnisdaten',
      discarded: 'Ergebnisdaten verworfen',
    }[materialization.reason]
  }`;
}

function ResultDescription({
  result,
  workspaceDocument,
  availability,
}: {
  result: Result;
  workspaceDocument: WorkspaceDocument;
  availability: DatasetAvailabilityContext;
}) {
  const sourceRun = workspaceDocument.runs[result.runId];
  const analysis = sourceRun?.snapshot.analysisId
    ? workspaceDocument.analyses[sourceRun.snapshot.analysisId]
    : undefined;
  return (
    <>
      <strong>{result.name}</strong>
      <p>{resultExtent(result)}</p>
      <dl className="dw-meta-list">
        <div>
          <dt>Erstellt</dt>
          <dd>
            <time dateTime={result.createdAt}>{runTimeText(result.createdAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Aufbewahrung</dt>
          <dd>{result.retention === 'kept' ? 'Aufbewahrt' : 'Temporär'}</dd>
        </div>
      </dl>
      <p>{resultAvailability(result, workspaceDocument, availability)}</p>
      {sourceRun && (
        <p>
          {sourceRun.trigger === 'r-object-capture' ? 'Direkte R-Objektübernahme' : 'Lauf'} vom{' '}
          <time dateTime={sourceRun.startedAt ?? sourceRun.queuedAt}>
            {runTimeText(sourceRun.startedAt ?? sourceRun.queuedAt)}
          </time>
          {analysis && (
            <>
              {' '}
              zur Analyse „{analysis.name}“{analysis.archivedAt ? ' (archiviert)' : ''}
            </>
          )}
        </p>
      )}
    </>
  );
}

function InputDescription({
  input,
  workspaceDocument,
  availability,
}: {
  input: ResolvedTableInput;
  workspaceDocument: WorkspaceDocument;
  availability: DatasetAvailabilityContext;
}) {
  if (input.kind === 'result') {
    const result = workspaceDocument.results[input.resultId];
    return (
      <>
        <p>
          Explizit gebundenes Ergebnis als <code>{input.bindingName}</code>.
        </p>
        <div>
          {result ? (
            <ResultDescription
              result={result}
              workspaceDocument={workspaceDocument}
              availability={availability}
            />
          ) : (
            'Ergebnismetadaten nicht verfügbar'
          )}
        </div>
      </>
    );
  }
  const dataset = workspaceDocument.datasets[input.datasetId];
  const version = workspaceDocument.datasetVersions[input.versionId];
  const inputAvailability = version
    ? datasetAvailability(version, availability)
    : 'Datenstand nicht verfügbar';
  return (
    <>
      <p>
        {input.usage === 'bound' ? 'Explizit gebunden' : 'Möglicherweise verwendet'} als{' '}
        <code>{input.bindingName}</code>.
      </p>
      <p>
        <strong>{dataset?.name ?? 'Datensatz nicht verfügbar'}</strong>
        {dataset?.removedAt ? ' (entfernt)' : ''}
        {dataset && (
          <>
            {' '}
            (SQL-Name: <code>{dataset.sqlName}</code>)
          </>
        )}
      </p>
      <p>
        {version ? (
          <>
            Datenstand vom{' '}
            <time dateTime={version.createdAt}>{runTimeText(version.createdAt)}</time>
            {dataset &&
              (dataset.currentVersionId === version.id
                ? ' (aktueller Datenstand)'
                : ' (älterer Datenstand)')}
            .{' '}
            {version.rowCount === undefined
              ? 'Die Zeilenzahl ist unbekannt.'
              : `Er umfasst ${version.rowCount} Zeilen.`}
          </>
        ) : (
          'Metadaten des eingefrorenen Datenstands fehlen'
        )}
      </p>
      <p>{inputAvailability}</p>
    </>
  );
}

/** Read-only presentation of the existing workspaceDocument; expanding never starts an engine operation. */
export function RunDetails(props: RunDetailsProps) {
  return (
    <details className="run-details">
      <summary>Laufdetails und eingefrorener Code</summary>
      <RunDetailsContent {...props} />
    </details>
  );
}

interface RunDetailsProps {
  run: ExecutionRun;
  workspaceDocument: WorkspaceDocument;
  availability?: DatasetAvailabilityContext;
}

export function RunDetailsContent({
  run,
  workspaceDocument,
  availability = uncheckedAvailability,
}: RunDetailsProps) {
  const analysis = run.snapshot.analysisId
    ? workspaceDocument.analyses[run.snapshot.analysisId]
    : undefined;
  const parameters = Object.entries(run.snapshot.parameters);
  const visualizations = Object.values(workspaceDocument.visualizations).filter((visualization) =>
    run.resultIds.includes(visualization.tableResultId),
  );
  return (
    <div className="run-details-body">
      <dl className="run-metadata">
        <dt>Analyse</dt>
        <dd>
          {analysis ? (
            <>
              {analysis.name}
              {analysis.archivedAt ? ' (archiviert)' : ''}
            </>
          ) : run.trigger === 'r-object-capture' ? (
            'Direkte R-Objektübernahme ohne gespeicherte Analyse'
          ) : (
            'Analyse nicht mehr verfügbar'
          )}
        </dd>
        {run.snapshot.language !== 'sql' && (
          <>
            <dt>Analyserevision beim Start</dt>
            <dd>
              {run.snapshot.analysisRevision ?? 'Nicht angegeben'}
              {analysis &&
                run.snapshot.analysisRevision !== undefined &&
                analysis.revision !== run.snapshot.analysisRevision &&
                ` (aktuelle Analyse: Revision ${analysis.revision})`}
            </dd>
          </>
        )}
        <dt>Status</dt>
        <dd>{runStatusText(run)}</dd>
        <dt>Eingereiht</dt>
        <dd>
          <time dateTime={run.queuedAt}>{runTimeText(run.queuedAt)}</time>
        </dd>
        <dt>Gestartet</dt>
        <dd>
          {run.startedAt ? (
            <time dateTime={run.startedAt}>{runTimeText(run.startedAt)}</time>
          ) : (
            'Noch nicht gestartet'
          )}
        </dd>
        <dt>Beendet</dt>
        <dd>
          {run.finishedAt ? (
            <time dateTime={run.finishedAt}>{runTimeText(run.finishedAt)}</time>
          ) : (
            'Noch nicht beendet'
          )}
        </dd>
        <dt>Dauer</dt>
        <dd>{run.durationMs === undefined ? 'Noch nicht erfasst' : `${run.durationMs} ms`}</dd>
        {run.stopReason && (
          <>
            <dt>Beendigungsgrund</dt>
            <dd>
              {
                {
                  user: 'Abbruch durch Nutzer',
                  timeout: 'Zeitlimit',
                  'workspace-close': 'Projekt geschlossen',
                  'runtime-crash': 'Laufzeit abgestürzt',
                }[run.stopReason]
              }
            </dd>
          </>
        )}
      </dl>
      {run.trigger === 'r-object-capture' && (
        <p>
          Dieser Lauf erfasst den aktuellen Stand eines R-Sitzungsobjekts. Er führt das Skript nicht
          erneut aus und ordnet den Objektstand keiner früheren Skriptausführung zu.
        </p>
      )}
      <p>
        Herkunft:{' '}
        {
          {
            'declared-inputs': 'Deklarierte Eingaben',
            'session-dependent': 'Sitzungsabhängig; weiterer R-Zustand kann verwendet worden sein',
            'untracked-sources': 'Weitere Quellen wurden nicht protokolliert',
          }[run.snapshot.provenance]
        }
        .
        {run.snapshot.environmentMode && (
          <>
            {' '}
            R-Umgebung:{' '}
            {run.snapshot.environmentMode === 'workspace-session'
              ? 'Projektsitzung'
              : 'Frisches Environment'}
            .
          </>
        )}
        {run.snapshot.randomSeed !== undefined && <> Zufallsseed: {run.snapshot.randomSeed}.</>}
      </p>
      {run.trigger !== 'r-object-capture' &&
        run.snapshot.notes.map((note, index) => <p key={index}>{note}</p>)}
      <h3>Eingefrorener Code</h3>
      <pre>{run.snapshot.code || '(kein Code)'}</pre>
      <h3>Parameter</h3>
      {parameters.length ? (
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Typ</th>
              <th scope="col">Wert</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map(([name, value]) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>{parameterType(value)}</td>
                <td>
                  <code>{parameterText(value)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Keine Parameter.</p>
      )}
      <h3>Eingefrorene Eingaben</h3>
      {run.snapshot.inputScope === 'workspace-snapshot' && (
        <p>
          SQL-Projektsnapshot: Hier sind die beim Start verfügbaren Quellen aufgeführt.
          „Möglicherweise verwendet“ bedeutet nicht, dass die Abfrage diese Quelle tatsächlich
          gelesen hat.
        </p>
      )}
      {run.snapshot.inputScope === 'session-capture' && (
        <p>
          Aufnahme aus einer R-Sitzung; die ursprünglichen Eingaben des Objektstands sind nicht
          vollständig protokolliert.
        </p>
      )}
      {run.snapshot.resolvedInputs.length ? (
        <ul className="run-inputs">
          {run.snapshot.resolvedInputs.map((input, index) => (
            <li key={index}>
              <InputDescription
                input={input}
                workspaceDocument={workspaceDocument}
                availability={availability}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine Tabelleneingaben protokolliert.</p>
      )}
      <h3>Ergebnisse dieses Laufes</h3>
      {run.resultIds.length ? (
        <ul className="run-results">
          {run.resultIds.map((id) => (
            <li key={id}>
              {workspaceDocument.results[id] ? (
                <ResultDescription
                  result={workspaceDocument.results[id]}
                  workspaceDocument={workspaceDocument}
                  availability={availability}
                />
              ) : (
                'Ergebnismetadaten nicht verfügbar'
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine Ergebnisse.</p>
      )}
      {visualizations.length > 0 && (
        <>
          <h3>Gespeicherte Diagramme</h3>
          <ul>
            {visualizations.map((visualization) => (
              <li key={visualization.id}>
                <strong>{visualization.name}</strong>
                <p>
                  Tabellenergebnis:{' '}
                  {workspaceDocument.results[visualization.tableResultId]?.name ??
                    'nicht verfügbar'}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <details className="run-technical">
        <summary>Technische IDs, Laufzeit und Rohdaten</summary>
        {run.snapshot.language === 'sql' && (
          <p>
            Interne Analyserevision beim Start: {run.snapshot.analysisRevision ?? 'Nicht angegeben'}
          </p>
        )}
        <pre>
          {JSON.stringify(
            {
              run,
              results: run.resultIds.map((id) => workspaceDocument.results[id]),
              visualizations,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}

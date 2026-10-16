import type {ArtifactReferenceCheck} from '../../application/ports';
import type {
  CsvImportOptions,
  Dataset,
  DatasetVersion,
  WorkspaceDocument,
} from '../../domain/model';

export interface DatasetAvailabilityContext {
  mode: 'persistent' | 'temporary';
  missingArtifacts: readonly string[] | undefined;
  integrity: ArtifactReferenceCheck | undefined;
  hashesChecked: boolean;
}

export function datasetAvailability(
  version: DatasetVersion,
  context: DatasetAvailabilityContext,
): string {
  if (version.backing.kind === 'public-parquet')
    return 'Referenz · Externer Stand nicht eingefroren';
  if (version.backing.kind === 'missing')
    return version.backing.reason === 'recipe-import'
      ? 'Nicht verfügbar · Im Projektarchiv ohne Datenbytes enthalten'
      : 'Nicht verfügbar · Quelle fehlt';
  const artifactId = version.backing.artifactId;
  if (context.integrity?.corrupt.includes(artifactId)) return 'Nicht verfügbar · Datei beschädigt';
  if (
    context.missingArtifacts?.includes(artifactId) ||
    context.integrity?.missing.includes(artifactId)
  )
    return 'Nicht verfügbar · Datei fehlt';
  if (context.mode === 'temporary') return 'Nur diese Sitzung';
  if (context.hashesChecked && context.integrity?.referenced.includes(artifactId))
    return 'Lokal vorhanden · Hash in dieser Sitzung geprüft';
  if (context.missingArtifacts || context.integrity?.referenced.includes(artifactId))
    return 'Lokal vorhanden · Hash in dieser Sitzung noch nicht geprüft';
  return 'Lokale Datei · Verfügbarkeit noch ungeprüft';
}

function Timestamp({value}: {value: string}) {
  return <time dateTime={value}>{new Date(value).toLocaleString('de-CH')}</time>;
}

function CsvOptions({options}: {options: CsvImportOptions}) {
  const delimiter =
    options.delimiter === ';'
      ? 'Semikolon (;)'
      : options.delimiter === ','
        ? 'Komma (,)'
        : options.delimiter === '|'
          ? 'Senkrechter Strich (|)'
          : 'Tabulator';
  return (
    <details className="dataset-import-options">
      <summary>CSV-Importoptionen</summary>
      <dl className="dataset-version-metadata">
        <dt>Zeichenkodierung</dt>
        <dd>UTF-8</dd>
        <dt>Trennzeichen</dt>
        <dd>{delimiter}</dd>
        <dt>Spaltennamen in erster Zeile</dt>
        <dd>{options.header ? 'Ja' : 'Nein'}</dd>
        <dt>Dezimalzeichen</dt>
        <dd>{options.decimalSeparator}</dd>
        <dt>NULL-Marker</dt>
        <dd>
          {options.nullStrings.length
            ? options.nullStrings.map((value) => JSON.stringify(value)).join(', ')
            : 'Keine zusätzlichen Marker'}
        </dd>
        <dt>Leerer Wert</dt>
        <dd>{options.emptyStringIsNull ? 'Als NULL importiert' : 'Als Leerstring importiert'}</dd>
        <dt>Anführungs- und Escapezeichen</dt>
        <dd>Doppeltes Anführungszeichen (")</dd>
      </dl>
    </details>
  );
}

function SourceDetails({
  version,
  workspaceDocument,
}: {
  version: DatasetVersion;
  workspaceDocument: WorkspaceDocument;
}) {
  const origin = version.origin;
  if (origin.kind === 'file')
    return (
      <>
        <dt>Quelle</dt>
        <dd>
          Datei {origin.fileName} · {origin.format.toUpperCase()}
          {origin.csvOptions && <CsvOptions options={origin.csvOptions} />}
        </dd>
      </>
    );
  if (origin.kind === 'portal')
    return (
      <>
        <dt>Quelle</dt>
        <dd>Portal · {origin.providerId}</dd>
        <dt>Portalbezug</dt>
        <dd>
          {origin.target.kind === 'dataset'
            ? `Datensatz ${origin.target.entryId}`
            : `Serie ${origin.target.seriesId} · Ausgabe ${origin.target.issueId}`}
          {' · '}Tabelle {origin.tableId}
        </dd>
        <dt>Quelle beobachtet</dt>
        <dd>
          <Timestamp value={origin.observedAt} />
        </dd>
        <dt>Quellenadresse</dt>
        <dd>{origin.canonicalUrl}</dd>
        {origin.license && (
          <>
            <dt>Lizenz</dt>
            <dd>{origin.license}</dd>
          </>
        )}
      </>
    );
  const result = workspaceDocument.results[origin.resultId];
  const run = result && workspaceDocument.runs[result.runId];
  const analysis = run?.snapshot.analysisId
    ? workspaceDocument.analyses[run.snapshot.analysisId]
    : undefined;
  return (
    <>
      <dt>Quelle</dt>
      <dd>Ergebnis{result ? ` · ${result.name}` : ''}</dd>
      {run && (
        <>
          <dt>Lauf</dt>
          <dd>
            <Timestamp value={run.queuedAt} />
          </dd>
          <dt>Analyse</dt>
          <dd>
            {analysis
              ? `${analysis.name}${analysis.archivedAt ? ' (archiviert)' : ''} · Revision ${run.snapshot.analysisRevision ?? 'nicht angegeben'}`
              : run.trigger === 'r-object-capture'
                ? 'R-Objektübernahme ohne gespeicherte Analyse'
                : 'Keine gespeicherte Analyse zugeordnet'}
          </dd>
        </>
      )}
    </>
  );
}

export function DatasetHistory({
  dataset,
  workspaceDocument,
  availability,
}: {
  dataset: Dataset;
  workspaceDocument: WorkspaceDocument;
  availability: DatasetAvailabilityContext;
}) {
  const versions = Object.values(workspaceDocument.datasetVersions)
    .filter((version) => version.datasetId === dataset.id)
    .sort(
      (left, right) =>
        Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
        Number(right.id === dataset.currentVersionId) -
          Number(left.id === dataset.currentVersionId) ||
        left.id.localeCompare(right.id),
    );
  return (
    <details className="dataset-history">
      <summary>Datenstände und Herkunft ({versions.length})</summary>
      <ol className="dataset-versions">
        {versions.map((version) => (
          <li className="dataset-version" key={version.id}>
            <div className="dataset-version-heading">
              <strong>
                {version.id === dataset.currentVersionId
                  ? 'Aktueller Datenstand'
                  : 'Früherer Datenstand'}
              </strong>
              <Timestamp value={version.createdAt} />
            </div>
            <dl className="dataset-version-metadata">
              <SourceDetails version={version} workspaceDocument={workspaceDocument} />
              <dt>Umfang</dt>
              <dd>
                {version.rowCount === undefined
                  ? 'Zeilenanzahl nicht ermittelt'
                  : `${version.rowCount} Zeilen`}{' '}
                · {version.schema.columns.length} Spalten
              </dd>
              <dt>Herkunftsnachweis</dt>
              <dd>
                {version.evidence.kind === 'sha256' ? (
                  <>
                    Gespeicherter SHA-256: <code>{version.evidence.value}</code>
                  </>
                ) : version.evidence.kind === 'publisher-version' ? (
                  <>Anbieterversion: {version.evidence.value} · Kein Inhalts-Hash</>
                ) : (
                  'Kein geprüfter Herkunftsnachweis'
                )}
              </dd>
              <dt>Ablage</dt>
              <dd>
                {version.backing.kind === 'artifact' ? (
                  <>
                    Lokale Parquet-Datei
                    {workspaceDocument.artifacts[version.backing.artifactId]
                      ? ` · ${workspaceDocument.artifacts[version.backing.artifactId]!.bytes} Bytes`
                      : ''}
                  </>
                ) : version.backing.kind === 'public-parquet' ? (
                  <>Externe Parquet-Referenz · {version.backing.url}</>
                ) : (
                  'Keine verfügbaren Datenbytes'
                )}
              </dd>
              <dt>Verfügbarkeit</dt>
              <dd>{datasetAvailability(version, availability)}</dd>
            </dl>
            <details className="dataset-version-technical">
              <summary>Technische IDs</summary>
              <dl className="dataset-version-metadata">
                <dt>Datenstand-ID</dt>
                <dd>
                  <code>{version.id}</code>
                </dd>
                <dt>Datensatz-ID</dt>
                <dd>
                  <code>{dataset.id}</code>
                </dd>
                {version.origin.kind === 'result' && (
                  <>
                    <dt>Ergebnis-ID</dt>
                    <dd>
                      <code>{version.origin.resultId}</code>
                    </dd>
                  </>
                )}
                {version.backing.kind === 'artifact' && (
                  <>
                    <dt>Artefakt-ID</dt>
                    <dd>
                      <code>{version.backing.artifactId}</code>
                    </dd>
                  </>
                )}
              </dl>
            </details>
            <details className="dataset-version-schema">
              <summary>Schema ({version.schema.columns.length} Spalten)</summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Spalte</th>
                      <th>Datentyp</th>
                      <th>NULL erlaubt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {version.schema.columns.map((column) => (
                      <tr key={column.name}>
                        <td>{column.name}</td>
                        <td>{column.logicalType}</td>
                        <td>{column.nullable ? 'Ja' : 'Nein'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </details>
  );
}

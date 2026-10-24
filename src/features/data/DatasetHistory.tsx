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
    return 'Der externe Datenstand wird referenziert und ist nicht eingefroren.';
  if (version.backing.kind === 'missing')
    return version.backing.reason === 'recipe-import'
      ? 'Nicht verfügbar, da das Projektarchiv keine Datenbytes enthält.'
      : 'Nicht verfügbar, da die Quelle fehlt.';
  const artifactId = version.backing.artifactId;
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

function Timestamp({value}: {value: string}) {
  return <time dateTime={value}>{new Date(value).toLocaleString('de-CH')}</time>;
}

function csvQuoteName(character: CsvImportOptions['quote']) {
  if (character === '"') return 'Doppelte Anführungszeichen (")';
  if (character === "'") return "Einfache Anführungszeichen (')";
  return 'Keine';
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
        <dt>Spaltentrennzeichen</dt>
        <dd>{delimiter}</dd>
        <dt>Spaltennamen in erster Zeile</dt>
        <dd>{options.header ? 'Ja' : 'Nein'}</dd>
        <dt>Dezimalzeichen</dt>
        <dd>{options.decimalSeparator}</dd>
        <dt>Zusätzlicher Wert für fehlende Angaben (NULL)</dt>
        <dd>
          {options.nullStrings.length
            ? options.nullStrings.map((value) => JSON.stringify(value)).join(', ')
            : 'Keiner'}
        </dd>
        <dt>Leere Felder ohne Textbegrenzung</dt>
        <dd>
          {options.emptyStringIsNull
            ? 'Als fehlender Wert (NULL) importiert'
            : 'Als leerer Text importiert'}
        </dd>
        <dt>Textbegrenzungszeichen</dt>
        <dd>{csvQuoteName(options.quote)}</dd>
        <dt>Escapezeichen</dt>
        <dd>{csvQuoteName(options.escape)}</dd>
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
          Datei {origin.fileName} ({origin.format.toUpperCase()})
          {origin.csvOptions && <CsvOptions options={origin.csvOptions} />}
        </dd>
      </>
    );
  if (origin.kind === 'portal')
    return (
      <>
        <dt>Quelle</dt>
        <dd>Portal {origin.providerId}</dd>
        {origin.target.kind === 'dataset' ? (
          <>
            <dt>Portaldatensatz</dt>
            <dd>{origin.target.entryId}</dd>
          </>
        ) : (
          <>
            <dt>Serie</dt>
            <dd>{origin.target.seriesId}</dd>
            <dt>Ausgabe</dt>
            <dd>{origin.target.issueId}</dd>
          </>
        )}
        <dt>Portaltabelle</dt>
        <dd>{origin.tableId}</dd>
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
      <dd>{result ? `Ergebnis „${result.name}“` : 'Ergebnis nicht verfügbar'}</dd>
      {run && (
        <>
          <dt>Lauf</dt>
          <dd>
            <Timestamp value={run.queuedAt} />
          </dd>
          <dt>Analyse</dt>
          <dd>
            {analysis
              ? `${analysis.name}${analysis.archivedAt ? ' (archiviert)' : ''}`
              : run.trigger === 'r-object-capture'
                ? 'R-Objektübernahme ohne gespeicherte Analyse'
                : 'Keine gespeicherte Analyse zugeordnet'}
          </dd>
          <dt>Analyserevision beim Start</dt>
          <dd>{run.snapshot.analysisRevision ?? 'Nicht angegeben'}</dd>
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
              <dt>Zeilen</dt>
              <dd>
                {version.rowCount === undefined ? 'Zeilenanzahl nicht ermittelt' : version.rowCount}
              </dd>
              <dt>Spalten</dt>
              <dd>{version.schema.columns.length}</dd>
              <dt>Herkunftsnachweis</dt>
              <dd>
                {version.evidence.kind === 'sha256' ? (
                  <>
                    Gespeicherter SHA-256: <code>{version.evidence.value}</code>
                  </>
                ) : version.evidence.kind === 'publisher-version' ? (
                  <>Anbieterversion: {version.evidence.value}. Ein Inhalts-Hash liegt nicht vor.</>
                ) : (
                  'Kein geprüfter Herkunftsnachweis'
                )}
              </dd>
              <dt>Ablage</dt>
              <dd>
                {version.backing.kind === 'artifact' ? (
                  <>Lokale Parquet-Datei</>
                ) : version.backing.kind === 'public-parquet' ? (
                  <>Externe Parquet-Referenz: {version.backing.url}</>
                ) : (
                  'Keine verfügbaren Datenbytes'
                )}
              </dd>
              {version.backing.kind === 'artifact' &&
                workspaceDocument.artifacts[version.backing.artifactId] && (
                  <>
                    <dt>Dateigrösse</dt>
                    <dd>{workspaceDocument.artifacts[version.backing.artifactId]!.bytes} Bytes</dd>
                  </>
                )}
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
                      <th scope="col">Spalte</th>
                      <th scope="col">Datentyp</th>
                      <th scope="col">NULL erlaubt</th>
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

import {MenuButton} from '../../ui/ActionMenu';
import {numericColumn} from '../../ui/table';
import {
  Button,
  Input,
  Select,
  FormField,
  ActionGroup,
  FileInput,
  EmptyState,
  Notice,
  ActionStatus,
  PanelHeader,
} from '../../ui/Controls';
import {useActionFeedback} from '../../ui/useActionFeedback';
import {useFormValidation, useNameField} from '../../ui/useFormValidation';
import {
  displayNameError,
  sqlNameError,
  csvColumnNameError,
  requiredValueError,
} from '../../domain/fieldValidation';
import type {EditingSession} from '../../application/workspaceService';
import {Modal} from '../../ui/Modal';
import {PortalImport} from '../catalog/PortalImport';
import {useEffect, useRef, useState} from 'react';
import {Link} from '@tanstack/react-router';
import {useStore} from 'zustand';
import {useWorkspace, report} from '../../app/router';
import type {CsvImportOptions, Dataset, DatasetId, TableSchema} from '../../domain/model';
import type {ImportPreview} from '../../application/importPorts';
import {downloadStream} from '../../app/download';
import {DatasetHistory, datasetAvailability} from './DatasetHistory';
const defaults = (): CsvImportOptions => ({
  encoding: 'utf-8',
  delimiter: ';',
  header: true,
  quote: '"',
  escape: '"',
  decimalSeparator: '.',
  nullStrings: [],
  emptyStringIsNull: true,
  columns: [],
});
function importFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes.toLocaleString('de-CH')} Bytes`;
  const unit = bytes < 1048576 ? 'KiB' : 'MiB';
  const value = bytes / (unit === 'KiB' ? 1024 : 1048576);
  return `${value.toLocaleString('de-CH', {maximumFractionDigits: 1})} ${unit}`;
}
const types = [
  'VARCHAR',
  'BOOLEAN',
  'INTEGER',
  'BIGINT',
  'UBIGINT',
  'DOUBLE',
  'DATE',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'DECIMAL(18,4)',
  'DECIMAL(38,18)',
];
function DatasetNameField({session, dataset}: {session: EditingSession; dataset: Dataset}) {
  const name = useNameField(
    dataset.name,
    'Datensatznamen',
    (value) => session.renameDataset(dataset.id, value),
    report,
  );
  return (
    <FormField label={`Anzeigename ${dataset.sqlName}`} error={name.error}>
      <Input {...name.input} disabled={session.readOnly} />
    </FormField>
  );
}
export function PreviewTable({preview}: {preview: Pick<ImportPreview, 'schema' | 'rows'>}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {preview.schema.columns.map((c) => (
              <th
                scope="col"
                key={c.name}
                className={numericColumn(c.logicalType) ? 'numeric' : undefined}
              >
                {c.name}
                <small>{c.logicalType}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, index) => (
            <tr key={index}>
              {row.map((value, column) => (
                <td
                  key={column}
                  className={
                    numericColumn(preview.schema.columns[column]?.logicalType)
                      ? 'numeric'
                      : undefined
                  }
                >
                  {value === null ? <i>NULL</i> : value === '' ? <i>Leerstring</i> : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ProjectDataPage() {
  const {state} = useWorkspace();
  const project = useStore(state.store, (s) => s.document.workspace);
  return (
    <div className="project-details project-data-page">
      <h1>Daten</h1>
      <p className="project-context">
        Projekt:{' '}
        <Link to="/projects/$workspaceId" params={{workspaceId: project.id}}>
          {project.name}
        </Link>
      </p>
      <DataSection />
    </div>
  );
}
export function DataSection() {
  const {session, state} = useWorkspace();
  const doc = useStore(state.store, (s) => s.document);
  const [importing, setImporting] = useState<{replace?: DatasetId} | undefined>();
  const [portal, setPortal] = useState<{replace?: DatasetId}>();
  const [removing, setRemoving] = useState<Dataset>();
  const [preview, setPreview] = useState<ImportPreview>();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const pending = useRef(false);
  const [inventory, setInventory] = useState<{missing: string[]; orphans: string[]}>();
  const cleanupFeedback = useActionFeedback();
  const refresh = (attempt: number) =>
    session
      .getDatasets()
      .inventory(new AbortController().signal)
      .then((value) => {
        if (cleanupFeedback.isCurrent(attempt)) setInventory(value);
      });
  const act = (action: string, work: (attempt: number) => Promise<unknown>) => {
    if (pending.current) return;
    const attempt = cleanupFeedback.begin();
    pending.current = true;
    setBusyAction(action);
    setBusy(true);
    void Promise.resolve()
      .then(() => work(attempt))
      .catch((error: unknown) => {
        if (cleanupFeedback.isCurrent(attempt)) report(error);
      })
      .finally(() => {
        if (!cleanupFeedback.isCurrent(attempt)) return;
        pending.current = false;
        setBusy(false);
        setBusyAction('');
      });
  };
  useEffect(() => {
    const control = new AbortController();
    void session
      .getDatasets()
      .inventory(control.signal)
      .then((value) => {
        if (!control.signal.aborted) setInventory(value);
      })
      .catch((error: unknown) => {
        if (!control.signal.aborted) report(error);
      });
    return () => control.abort();
  }, [session, doc.revision]);
  const datasets = Object.values(doc.datasets).filter((d) => !d.removedAt);
  const removedDatasets = Object.values(doc.datasets).filter((dataset) => dataset.removedAt);
  const availability = {
    mode: session.mode,
    missingArtifacts: inventory?.missing,
    integrity: session.integrity,
    hashesChecked: session.hashesChecked,
  };
  return (
    <section>
      <PanelHeader title="Datensätze">
        <MenuButton
          label="Daten hinzufügen"
          variant="primary"
          disabled={session.readOnly || busy}
          actions={[
            {label: 'Datei hinzufügen', onSelect: () => setImporting({})},
            {label: 'Aus Portal hinzufügen', onSelect: () => setPortal({})},
          ]}
        />
      </PanelHeader>
      {datasets.length === 0 ? (
        <EmptyState>Noch keine Datensätze.</EmptyState>
      ) : (
        <ul className="dataset-list">
          {datasets.map((dataset) => {
            const version = doc.datasetVersions[dataset.currentVersionId]!;
            return (
              <li key={dataset.id}>
                <div>
                  <DatasetNameField session={session} dataset={dataset} />
                  <code>data.{dataset.sqlName}</code>
                  <span>
                    {version.rowCount === undefined
                      ? 'Zeilenanzahl nicht ermittelt'
                      : `${version.rowCount} Zeilen`}
                  </span>
                  <span>{datasetAvailability(version, availability)}</span>
                </div>
                <ActionGroup>
                  <Button
                    disabled={busy}
                    busy={busyAction === `inspect-${dataset.id}`}
                    busyLabel="Daten werden geladen …"
                    onClick={() => {
                      act(`inspect-${dataset.id}`, () =>
                        session
                          .getDatasets()
                          .inspect(dataset.id, new AbortController().signal)
                          .then(setPreview),
                      );
                    }}
                  >
                    Daten ansehen
                  </Button>
                  <Button
                    disabled={busy}
                    busy={busyAction === `export-${dataset.id}`}
                    busyLabel="Parquet wird exportiert …"
                    onClick={() => {
                      act(`export-${dataset.id}`, () =>
                        session
                          .getDatasets()
                          .export(dataset.id, new AbortController().signal)
                          .then((data) =>
                            downloadStream(
                              data,
                              `${dataset.sqlName}.parquet`,
                              'application/vnd.apache.parquet',
                            ),
                          ),
                      );
                    }}
                  >
                    Parquet exportieren
                  </Button>
                  {version.backing.kind === 'public-parquet' && (
                    <Button
                      disabled={session.readOnly || busy}
                      busy={busyAction === `keep-${dataset.id}`}
                      busyLabel="Daten werden gesichert …"
                      onClick={() => {
                        if (session.readOnly) return;
                        act(`keep-${dataset.id}`, () =>
                          session.getDatasets().keepLocal(dataset.id, new AbortController().signal),
                        );
                      }}
                    >
                      Lokal sichern
                    </Button>
                  )}
                  {version.origin.kind === 'portal' && (
                    <Button
                      disabled={session.readOnly || busy}
                      onClick={() => setPortal({replace: dataset.id})}
                    >
                      Portalstand ersetzen
                    </Button>
                  )}
                  <Button
                    disabled={session.readOnly || busy}
                    onClick={() => setImporting({replace: dataset.id})}
                  >
                    Daten ersetzen
                  </Button>
                  <Button
                    variant="secondary"
                    tone="danger"
                    disabled={session.readOnly || busy}
                    onClick={() => setRemoving(dataset)}
                  >
                    Einbindung entfernen
                  </Button>
                </ActionGroup>
                <DatasetHistory
                  dataset={dataset}
                  workspaceDocument={doc}
                  availability={availability}
                />
              </li>
            );
          })}
        </ul>
      )}
      {removedDatasets.length > 0 && (
        <details className="removed-datasets">
          <summary>Entfernte Dateneinbindungen ({removedDatasets.length})</summary>
          <ul className="dataset-list">
            {removedDatasets.map((dataset) => (
              <li key={dataset.id}>
                <div>
                  <strong>{dataset.name}</strong>
                  <code>data.{dataset.sqlName}</code>
                  <span>
                    Entfernt am{' '}
                    <time dateTime={dataset.removedAt}>
                      {new Date(dataset.removedAt!).toLocaleString('de-CH')}
                    </time>
                  </span>
                </div>
                <DatasetHistory
                  dataset={dataset}
                  workspaceDocument={doc}
                  availability={availability}
                />
              </li>
            ))}
          </ul>
        </details>
      )}
      {inventory && inventory.orphans.length > 0 && (
        <p>
          {inventory.orphans.length} nicht referenzierte Dateien.{' '}
          <Button
            disabled={session.readOnly || busy}
            busy={busyAction === 'cleanup'}
            busyLabel="Dateien werden bereinigt …"
            onClick={() => {
              if (session.readOnly) return;
              act('cleanup', (attempt) =>
                session
                  .getDatasets()
                  .cleanOrphans(new AbortController().signal)
                  .then(async (count) => {
                    await refresh(attempt);
                    cleanupFeedback.show(attempt, `${count} verwaiste Dateien entfernt.`, 'brief');
                  }),
              );
            }}
          >
            Verwaiste Dateien bereinigen
          </Button>
        </p>
      )}
      {cleanupFeedback.message && <ActionStatus>{cleanupFeedback.message}</ActionStatus>}
      {busy && <Notice tone="info">Daten werden geprüft …</Notice>}
      {preview && (
        <div className="data-preview">
          <Button onClick={() => setPreview(undefined)}>Vorschau schliessen</Button>
          <p>Die Vorschau zeigt maximal 200 Zeilen. NULL und Leerstring sind unterscheidbar.</p>
          <PreviewTable preview={preview} />
        </div>
      )}
      {portal && (
        <PortalImport session={session} {...portal} onClose={() => setPortal(undefined)} />
      )}
      {importing && <ImportDialog {...importing} onClose={() => setImporting(undefined)} />}
      {removing && (
        <Modal
          title="Einbindung entfernen"
          onClose={() => setRemoving(undefined)}
          showClose={false}
          footer={
            <>
              <ActionGroup>
                <Button
                  variant="primary"
                  tone="danger"
                  onClick={() => {
                    session.removeDataset(removing.id);
                    setRemoving(undefined);
                  }}
                >
                  Entfernen bestätigen
                </Button>
                <Button onClick={() => setRemoving(undefined)}>Abbrechen</Button>
              </ActionGroup>
            </>
          }
        >
          <p>{removing.name} entfernen?</p>
          <p>
            Die Einbindung verschwindet aus aktiven Datenquellen. Versionen und Herkunft bleiben
            erhalten; der SQL-Name bleibt reserviert.
          </p>
          <p>
            Explizite Analyse-Inputs:{' '}
            {Object.values(doc.analyses)
              .filter((a) =>
                a.inputs.some(
                  (i) => i.source.kind === 'dataset' && i.source.datasetId === removing.id,
                ),
              )
              .map((a) => a.name)
              .join(', ') || 'keine'}
            . Weitere Abhängigkeiten im SQL-Code sind nicht vollständig erfasst.
          </p>
        </Modal>
      )}
    </section>
  );
}
function schemaDiff(previous: TableSchema, next: TableSchema) {
  const names = new Set([
    ...previous.columns.map((c) => c.name),
    ...next.columns.map((c) => c.name),
  ]);
  return [...names]
    .map((name) => {
      const old = previous.columns.find((c) => c.name === name)?.logicalType;
      const now = next.columns.find((c) => c.name === name)?.logicalType;
      return old === now ? null : `${name}: ${old ?? 'neu'} → ${now ?? 'entfällt'}`;
    })
    .filter((change): change is string => change !== null);
}
function ImportDialog({replace, onClose}: {replace?: DatasetId; onClose(): void}) {
  const {session} = useWorkspace();
  const service = session.getDatasets();
  const previous = replace ? session.document.datasets[replace] : undefined;
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<'csv' | 'parquet'>('csv');
  const [name, setName] = useState(previous?.name ?? '');
  const [sqlName, setSqlName] = useState(previous?.sqlName ?? '');
  const [options, setOptions] = useState(defaults);
  const [original, setOriginal] = useState(true);
  const [preview, setPreview] = useState<ImportPreview>();
  const [dirty, setDirty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<'preview' | 'confirm'>();
  const pending = useRef(false);
  const [error, setError] = useState('');
  const fileDropRef = useRef<HTMLDivElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const errorFocusRef = useRef<HTMLElement>(null);
  const occupied = Object.values(session.document.datasets)
    .filter((d) => d.id !== replace)
    .map((d) => d.sqlName);
  const columnKeys = options.columns.map((_, i) => `column-${i}`);
  const exampleDelimiter = options.delimiter === '\t' ? ' ⇥ ' : options.delimiter;
  const textExample = `${options.quote}Basel${exampleDelimiter} Nord${options.quote}`;
  const advancedSettings = [
    ...(!options.emptyStringIsNull ? ['Leere Felder bleiben leerer Text'] : []),
    ...(options.nullStrings.length
      ? [`Fehlende Werte: ${options.nullStrings.map((value) => JSON.stringify(value)).join(', ')}`]
      : []),
  ];
  const form = useFormValidation({
    file: () => (file ? undefined : 'Bitte wähle eine CSV- oder Parquet-Datei aus.'),
    name: () => displayNameError(name, 'Datensatznamen'),
    sqlName: () => (replace ? undefined : sqlNameError(sqlName, occupied)),
    delimiter: () => requiredValueError(options.delimiter),
    quote: () => requiredValueError(options.quote || 'none'),
    decimalSeparator: () => requiredValueError(options.decimalSeparator),
    ...Object.fromEntries(
      options.columns.flatMap((column, i) => [
        [
          `column-${i}`,
          () =>
            csvColumnNameError(
              column.name,
              options.columns.filter((_, index) => i !== index).map((c) => c.name),
            ),
        ],
        [`type-${i}`, () => requiredValueError(column.logicalType)],
      ]),
    ),
  });
  const controller = useRef<AbortController | undefined>(undefined);
  const key = useRef<string | undefined>(undefined);
  useEffect(
    () => () => {
      controller.current?.abort();
      if (key.current) void service.discard(key.current);
    },
    [service],
  );
  const select = (chosen: File | undefined) => {
    if (!chosen) return;
    errorFocusRef.current = fileDropRef.current?.querySelector('button') ?? null;
    setError('');
    // A newly chosen file invalidates the previous preview even when unsupported.
    // Otherwise confirming after an XLSX selection would still import the old CSV.
    if (key.current) void service.discard(key.current);
    key.current = undefined;
    setFile(undefined);
    setPreview(undefined);
    setDirty(true);
    const extension = chosen.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'parquet') {
      setError('Unterstützt sind CSV und Parquet. Projektarchive werden separat importiert.');
      return;
    }
    setFile(chosen);
    form.change('file');
    setFormat(extension);
    setOptions(defaults());
    setError('');
    if (!previous) {
      setName(chosen.name.replace(/\.[^.]+$/, '').slice(0, 120));
      setSqlName(service.suggestName(chosen.name));
      form.reset();
    }
  };
  const change = (update: Partial<CsvImportOptions>) => {
    setOptions({...options, ...update});
    setDirty(true);
  };
  const load = () => {
    if (pending.current || session.readOnly) return;
    setError('');
    if (
      !form.validate([
        'file',
        ...(format === 'csv'
          ? [
              'delimiter',
              'quote',
              'decimalSeparator',
              ...columnKeys,
              ...options.columns.map((_, i) => `type-${i}`),
            ]
          : []),
      ]) ||
      !file
    )
      return;
    controller.current = new AbortController();
    pending.current = true;
    setBusyAction('preview');
    setBusy(true);
    setError('');
    const prior = key.current;
    void (async () => {
      if (prior) await service.discard(prior);
      const result = await service.preview(
        file,
        format,
        format === 'csv' ? options : undefined,
        controller.current!.signal,
      );
      key.current = result.key;
      setPreview(result);
      if (result.csvOptions) setOptions(result.csvOptions);
      setDirty(false);
    })()
      .catch((failure: unknown) =>
        setError(failure instanceof Error ? failure.message : String(failure)),
      )
      .finally(() => {
        pending.current = false;
        setBusyAction(undefined);
        setBusy(false);
      });
  };
  const confirm = () => {
    if (pending.current || session.readOnly || !preview || dirty) return;
    setError('');
    if (!form.validate(['name', 'sqlName'])) return;
    controller.current = new AbortController();
    pending.current = true;
    setBusyAction('confirm');
    setBusy(true);
    setError('');
    void service
      .confirm(
        preview.key,
        {name, sqlName, keepOriginal: original, ...(replace ? {replace} : {})},
        controller.current.signal,
      )
      .then(onClose)
      .catch((failure: unknown) =>
        setError(failure instanceof Error ? failure.message : String(failure)),
      )
      .finally(() => {
        pending.current = false;
        setBusyAction(undefined);
        setBusy(false);
      });
  };
  return (
    <Modal
      title={replace ? 'Daten ersetzen' : 'Datei importieren'}
      className="import-dialog"
      showClose={false}
      onClose={() => {
        if (busy) controller.current?.abort();
        else onClose();
      }}
      footer={
        <>
          <ActionGroup>
            <ActionGroup>
              <Button
                variant="primary"
                disabled={!preview || dirty || busy}
                busy={busyAction === 'confirm'}
                busyLabel="Datei wird importiert …"
                onClick={(event) => {
                  errorFocusRef.current = event.currentTarget;
                  confirm();
                }}
              >
                Import bestätigen
              </Button>
              <Button
                onClick={() => {
                  if (busy) controller.current?.abort();
                  else onClose();
                }}
              >
                {busy ? 'Verarbeitung abbrechen' : 'Schliessen'}
              </Button>
            </ActionGroup>
          </ActionGroup>
        </>
      }
    >
      <div
        ref={fileDropRef}
        className="file-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) {
            errorFocusRef.current = fileDropRef.current?.querySelector('button') ?? null;
            if (e.dataTransfer.files.length !== 1) setError('Bitte genau eine Datei wählen.');
            else select(e.dataTransfer.files[0]);
          }
        }}
      >
        <FormField label="Datei (CSV oder Parquet, maximal 128 MiB)" error={form.errors.file}>
          <FileInput
            {...form.control('file')}
            required
            selectedFile={file ?? null}
            type="file"
            accept=".csv,.parquet"
            disabled={busy}
            onChange={(e) => select(e.target.files?.[0])}
          />
        </FormField>
        <span>oder eine Datei hier ablegen</span>
      </div>
      <div className="import-fields">
        <FormField label={<>Anzeigename</>} error={form.errors.name}>
          <Input
            {...form.control('name')}
            required
            maxLength={120}
            value={name}
            disabled={busy}
            onChange={(e) => {
              setName(e.target.value);
              form.change('name', displayNameError(e.target.value, 'Datensatznamen'));
            }}
          />
        </FormField>
        <FormField label={<>SQL-Name</>} error={form.errors.sqlName}>
          <Input
            {...form.control('sqlName')}
            required={!replace}
            value={sqlName}
            disabled={!!replace || busy}
            onChange={(e) => {
              setSqlName(e.target.value);
              form.change('sqlName', sqlNameError(e.target.value, occupied));
            }}
          />
        </FormField>
      </div>
      {format === 'csv' && (
        <fieldset className="csv-import-settings" disabled={busy}>
          <legend>CSV-Importoptionen</legend>
          <div className="csv-import-grid">
            <FormField
              label="Spaltentrennzeichen"
              hint={
                <>
                  Trennt die Spalten, z. B. <code>{`Ort${exampleDelimiter}Einwohner`}</code>.
                  {options.delimiter === '\t' && ' ⇥ steht für einen Tabulator.'}
                </>
              }
              error={form.errors.delimiter}
            >
              <Select
                {...form.control('delimiter')}
                required
                value={options.delimiter}
                onChange={(e) =>
                  change({
                    delimiter: e.target.value as CsvImportOptions['delimiter'],
                    columns: [],
                  })
                }
              >
                <option value=";">Semikolon (;)</option>
                <option value=",">Komma (,)</option>
                <option value={'\t'}>Tabulator</option>
                <option value="|">Senkrechter Strich (|)</option>
              </Select>
            </FormField>
            <FormField
              label="Textbegrenzungszeichen"
              hint={
                <>
                  Auch Value Delimiter genannt.{' '}
                  {options.quote ? (
                    <>
                      Schützt Text mit Trennzeichen oder Zeilenumbrüchen, z. B.{' '}
                      <code>{textExample}</code>. Das Zeichen selbst wird im Text verdoppelt.
                    </>
                  ) : (
                    <>
                      Ohne Textbegrenzung werden Anführungszeichen als normaler Text gelesen. Ein
                      Wert darf dann kein Spaltentrennzeichen und keinen Zeilenumbruch enthalten.
                    </>
                  )}
                </>
              }
              error={form.errors.quote}
            >
              <Select
                {...form.control('quote')}
                required
                value={options.quote || 'none'}
                onChange={(e) => {
                  const quote = e.target.value === 'none' ? '' : e.target.value === "'" ? "'" : '"';
                  change({quote, escape: quote, columns: []});
                }}
              >
                <option value={'"'}>Doppelte Anführungszeichen (&quot;)</option>
                <option value="'">Einfache Anführungszeichen (')</option>
                <option value="none">Keine</option>
              </Select>
            </FormField>
            <FormField
              label="Dezimalzeichen"
              hint="So werden Dezimalzahlen in der Datei geschrieben. Tausendertrennzeichen werden nicht automatisch entfernt."
              error={form.errors.decimalSeparator}
            >
              <Select
                {...form.control('decimalSeparator')}
                required
                value={options.decimalSeparator}
                onChange={(e) =>
                  change({decimalSeparator: e.target.value as '.' | ',', columns: []})
                }
              >
                <option value=".">Punkt (1234.56)</option>
                <option value=",">Komma (1234,56)</option>
              </Select>
            </FormField>
            <FormField
              label="Erste Zeile enthält Spaltennamen"
              hint="Ausgeschaltet: Die erste Zeile wird als Datenzeile importiert; die Spalten erhalten automatisch Namen."
            >
              <Input
                type="checkbox"
                checked={options.header}
                onChange={(e) => change({header: e.target.checked, columns: []})}
              />
            </FormField>
          </div>
          <details className="csv-import-advanced">
            <summary tabIndex={0}>
              Erweiterte Optionen
              {advancedSettings.map((setting) => (
                <span className="csv-import-advanced-state" key={setting}>
                  {setting}
                </span>
              ))}
            </summary>
            <div className="csv-import-advanced-fields">
              <FormField
                label="Leere Felder als fehlende Werte (NULL) importieren"
                hint={
                  <>
                    Betrifft leere Felder zwischen zwei Trennzeichen: eingeschaltet = fehlender Wert
                    (NULL), ausgeschaltet = leerer Text.
                    {options.quote && (
                      <>
                        {' '}
                        <code>{`${options.quote}${options.quote}`}</code> bleibt immer leerer Text.
                      </>
                    )}
                  </>
                }
              >
                <Input
                  type="checkbox"
                  checked={options.emptyStringIsNull}
                  onChange={(e) => change({emptyStringIsNull: e.target.checked, columns: []})}
                />
              </FormField>
              <FormField
                label="Text für fehlende Werte"
                optional
                hint={
                  <>
                    Nur ausfüllen, wenn die Datei z. B. NA oder NULL für fehlende Angaben verwendet.
                    Ohne Eintrag bleiben diese Wörter normaler Text.
                    {options.quote && ' Text innerhalb von Textbegrenzungszeichen bleibt erhalten.'}
                  </>
                }
              >
                <Input
                  value={options.nullStrings[0] ?? ''}
                  onChange={(e) =>
                    change({nullStrings: e.target.value ? [e.target.value] : [], columns: []})
                  }
                />
              </FormField>
              <p className="csv-import-encoding">Die Datei wird als UTF-8 gelesen.</p>
            </div>
          </details>
          <FormField
            className="csv-import-original"
            label="Originaldatei zusätzlich behalten"
            hint={
              <>
                Sichert die CSV zusätzlich zur importierten Tabelle.
                {file
                  ? ` Benötigt zusätzlich ${importFileSize(file.size)} Speicherplatz.`
                  : ' Benötigt zusätzlich Speicherplatz in diesem Browser.'}
              </>
            }
          >
            <Input
              type="checkbox"
              checked={original}
              onChange={(e) => setOriginal(e.target.checked)}
            />
          </FormField>
          {options.columns.length > 0 && (
            <div className="column-options">
              {options.columns.map((column, i) => (
                <div key={i}>
                  <FormField label={<>Spalte {i + 1}</>} error={form.errors[`column-${i}`]}>
                    <Input
                      {...form.control(`column-${i}`)}
                      required
                      value={column.name}
                      onChange={(e) => {
                        form.change(
                          `column-${i}`,
                          csvColumnNameError(
                            e.target.value,
                            options.columns.filter((_, index) => i !== index).map((c) => c.name),
                          ),
                        );
                        change({
                          columns: options.columns.map((c, index) =>
                            index === i ? {...c, name: e.target.value} : c,
                          ),
                        });
                      }}
                    />
                  </FormField>
                  <FormField label={<>Typ {i + 1}</>}>
                    <Select
                      {...form.control(`type-${i}`)}
                      required
                      aria-label={`Typ ${i + 1}`}
                      value={column.logicalType}
                      onChange={(e) =>
                        change({
                          columns: options.columns.map((c, index) =>
                            index === i ? {...c, logicalType: e.target.value} : c,
                          ),
                        })
                      }
                    >
                      {[...new Set([column.logicalType, ...types])].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}
      <Button
        ref={previewButtonRef}
        disabled={busy}
        busy={busyAction === 'preview'}
        busyLabel="Vorschau wird geladen …"
        onClick={(event) => {
          errorFocusRef.current = event.currentTarget;
          load();
        }}
      >
        Vorschau laden
      </Button>
      {preview && dirty && (
        <ActionStatus>Einstellungen geändert. Bitte die Vorschau erneut laden.</ActionStatus>
      )}
      {preview && (
        <>
          <p>
            Maximal 200 Zeilen. Typen sind Vorschläge; der vollständige Import prüft jeden Wert
            strikt.
          </p>
          {previous && (
            <div className="schema-diff">
              <p>Schemaänderungen</p>
              {schemaDiff(
                session.document.datasetVersions[previous.currentVersionId]!.schema,
                preview.schema,
              ).length ? (
                <ul>
                  {schemaDiff(
                    session.document.datasetVersions[previous.currentVersionId]!.schema,
                    preview.schema,
                  ).map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              ) : (
                <p>Keine Schemaänderung.</p>
              )}
            </div>
          )}
          <PreviewTable preview={preview} />
        </>
      )}
      {error && (
        <Notice
          tone="danger"
          className="error"
          onDismiss={() => {
            if (!errorFocusRef.current?.isConnected || errorFocusRef.current.matches(':disabled'))
              errorFocusRef.current = previewButtonRef.current;
            setError('');
          }}
          dismissFocusRef={errorFocusRef}
        >
          {error}
        </Notice>
      )}
      {busy && <Notice tone="info">Datei wird verarbeitet …</Notice>}
    </Modal>
  );
}

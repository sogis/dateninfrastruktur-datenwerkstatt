import {numericColumn} from '../../ui/table';
import {Button, Input, Select, FormField, ActionGroup, Toolbar, Notice} from '../../ui/Controls';
import {useFormValidation} from '../../ui/useFormValidation';
import {displayNameError, sqlNameError} from '../../domain/fieldValidation';
import {ActionMenu, SplitButton} from '../../ui/ActionMenu';
import {Modal} from '../../ui/Modal';
import {NameDialog} from '../../ui/NameDialog';
import {latestSqlRun} from '../../domain/sqlRetention';
import {SqlDocuments, SqlFileInput} from './SqlDocuments';
import {useNavigate} from '@tanstack/react-router';
import {failureMessage} from '../../application/errors';
import {
  tableExportMediaType,
  XLSX_EXPORT_NOTE,
  type TableExportFormat,
} from '../../application/tableExport';
import {TransferToR} from '../r/Transfer';
import {useEffect, useId, useRef, useState, useSyncExternalStore} from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import type {
  Analysis,
  AnalysisId,
  ExecutionRun,
  SqlAnalysis,
  TableResult,
  Visualization,
} from '../../domain/model';
import type {EditingSession} from '../../application/workspaceService';
import type {CodeModels} from '../../infrastructure/monaco/models';
import type {Settings} from '../../infrastructure/storage/settings';
import {CodeEditor} from '../../ui/CodeEditor';
import {downloadStream} from '../../app/download';
import {
  parameterNameError,
  parameterValueError,
  parseParameterValue,
  type ParameterType,
} from '../../domain/parameterValues';
import {report, useWorkspace} from '../../app/router';
import {useStore} from 'zustand';
import {useMediaQuery, usePanelHeight} from '../../ui/PanelLayout';
import type {ImperativePanelGroupHandle} from 'react-resizable-panels';
import {Chart} from './chart';
import {RunDetails, RunStatus, runTimeText} from '../results/RunDetails';

export function SqlWorkbench({
  session,
  analysis,
  models,
  settings,
}: {
  session: EditingSession;
  analysis: SqlAnalysis;
  models: CodeModels;
  settings: Settings;
}) {
  const service = session.getAnalyses();
  const {view} = useWorkspace();
  const layout = useStore(view.store, (s) => s.value);
  const panels = useRef<ImperativePanelGroupHandle>(null);
  const editorPanels = useRef<ImperativePanelGroupHandle>(null);
  const {ref: panelHost, height: panelHeight} = usePanelHeight();
  const [panelWidth, setPanelWidth] = useState(1200);
  useEffect(() => {
    const host = panelHost.current;
    if (!host) return;
    let frame: number | undefined;
    const measure = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (host.clientWidth > 0) setPanelWidth(host.clientWidth);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    measure();
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [panelHost]);
  useSyncExternalStore(session.persistence.subscribe, () => session.persistence.document);
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const narrow = useMediaQuery('(max-width: 900px)');
  const schemaId = useId();
  const schemaTrigger = useRef<HTMLButtonElement>(null);
  const sqlFileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'new' | 'documents' | 'parameters' | 'results'>();
  const save = () => {
    if (!session.readOnly) void session.flush().catch((error: unknown) => report(error, session));
  };
  const [selectedResult, setSelectedResult] = useState<TableResult['id']>();
  const openDocument = (id: AnalysisId) => {
    setDialog(undefined);
    setSelectedResult(undefined);
    void navigate({
      to: '/projects/$workspaceId/sql/$analysisId',
      params: {workspaceId: session.document.workspace.id, analysisId: id},
    }).catch((error: unknown) => report(error, session));
  };
  const latest = latestSqlRun(session.document, analysis.id);
  const savedResult = selectedResult ? session.document.results[selectedResult] : undefined;
  const run = savedResult ? session.document.runs[savedResult.runId] : latest;
  const result =
    savedResult ?? (run?.resultIds[0] ? session.document.results[run.resultIds[0]] : undefined);
  const keptResults = Object.values(session.document.results)
    .filter(
      (item) =>
        item.retention === 'kept' &&
        session.document.runs[item.runId]?.snapshot.analysisId === analysis.id,
    )
    .reverse();
  const parameterCount = Object.keys(analysis.parameters).length;
  const closeSchema = () => {
    view.patch({dataPanelVisible: false});
    schemaTrigger.current?.focus();
  };
  const execute = (selection?: string) => {
    if (!session.scheduler.getSnapshot() && !session.readOnly) {
      setSelectedResult(undefined);
      void service.run(analysis.id, selection).catch((error: unknown) => report(error, session));
    }
  };

  const schemaPanel = layout.dataPanelVisible ? (
    <aside
      id={schemaId}
      className="sql-schema"
      aria-label="Tabellen & Spalten"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeSchema();
        }
      }}
    >
      <div className="sql-schema-heading">
        <h2>Tabellen &amp; Spalten</h2>
        <Button variant="tertiary" onClick={closeSchema}>
          Schliessen
        </Button>
      </div>
      {Object.values(session.document.datasets).filter((d) => !d.removedAt).length === 0 && (
        <p>Noch keine Tabellen eingebunden. Füge unter „Daten“ einen Datensatz hinzu.</p>
      )}
      {Object.values(session.document.datasets)
        .filter((d) => !d.removedAt)
        .map((d) => (
          <details key={d.id}>
            <summary>{d.sqlName}</summary>
            <dl className="dw-meta-list schema-columns">
              {session.document.datasetVersions[d.currentVersionId]!.schema.columns.map(
                (column) => (
                  <div key={column.name}>
                    <dt>{column.name}</dt>
                    <dd>{column.logicalType}</dd>
                  </div>
                ),
              )}
            </dl>
          </details>
        ))}
    </aside>
  ) : null;
  return (
    <div className="analysis-area">
      <Toolbar className="analysis-toolbar">
        <span className="analysis-name-text">Analysename: {analysis.name}</span>
        <ActionGroup>
          <Button
            variant="primary"
            icon="play-fill"
            busy={busy?.startsWith('SQL ') ?? false}
            busyLabel="SQL wird ausgeführt …"
            disabled={session.readOnly || !!busy}
            onClick={() => execute()}
          >
            Ausführen
          </Button>
          {busy === 'SQL ausführen' && (
            <Button icon="stop-fill" onClick={() => service.cancel()}>
              Abbrechen
            </Button>
          )}
          <Button icon="plus-lg" disabled={session.readOnly} onClick={() => setDialog('new')}>
            Neu
          </Button>
          <Button icon="folder2-open" onClick={() => setDialog('documents')}>
            Öffnen
          </Button>
          <Button icon="floppy" disabled={session.readOnly} onClick={save}>
            Speichern
          </Button>
        </ActionGroup>
        <Button
          ref={schemaTrigger}
          aria-pressed={layout.dataPanelVisible}
          aria-expanded={layout.dataPanelVisible}
          aria-controls={schemaId}
          onClick={() => view.patch({dataPanelVisible: !layout.dataPanelVisible})}
        >
          Tabellen &amp; Spalten
        </Button>
        {parameterCount > 0 && (
          <Button variant="tertiary" onClick={() => setDialog('parameters')}>
            Parameter ({parameterCount})
          </Button>
        )}
        <ActionMenu
          label="Weitere Aktionen"
          actions={[
            {
              label: 'SQL-Datei öffnen',
              disabled: session.readOnly,
              onSelect: () => sqlFileInput.current?.click(),
            },
            {
              label: 'SQL-Datei herunterladen',
              onSelect: () => {
                void downloadStream(
                  new Blob([analysis.code], {type: 'application/sql;charset=utf-8'}).stream(),
                  `${analysis.name}.sql`,
                  'application/sql;charset=utf-8',
                ).catch((error: unknown) => report(error, session));
              },
            },
            {label: `Parameter (${parameterCount})`, onSelect: () => setDialog('parameters')},
            {
              label: 'Aufbewahrte Ergebnisse',
              disabled: !keptResults.length,
              onSelect: () => setDialog('results'),
            },
            {
              label: 'Arbeitsfläche zurücksetzen',
              onSelect: () => {
                view.reset();
                panels.current?.setLayout([45, 55]);
                if (!narrow && layout.dataPanelVisible) editorPanels.current?.setLayout([75, 25]);
              },
            },
          ]}
        />
      </Toolbar>
      <SqlFileInput
        key={`${session.sessionId}/${analysis.id}`}
        session={session}
        inputRef={sqlFileInput}
        onOpen={openDocument}
      />
      {dialog === 'new' && (
        <NameDialog
          title="Neue SQL-Analyse"
          label="Analysename"
          initialName="Neue SQL-Abfrage"
          submitLabel="Erstellen"
          onSubmit={async (name) => {
            const id = session.createAnalysis('sql', {name, code: 'SELECT 1 AS wert;'});
            openDocument(id);
          }}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog === 'documents' && (
        <SqlDocuments
          session={session}
          currentId={analysis.id}
          onOpen={openDocument}
          onNew={() => setDialog('new')}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog === 'parameters' && (
        <Parameters analysis={analysis} session={session} onClose={() => setDialog(undefined)} />
      )}
      {dialog === 'results' && (
        <Modal title="Aufbewahrte Ergebnisse" onClose={() => setDialog(undefined)}>
          <ul className="sql-document-list">
            {keptResults.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <br />
                  <time dateTime={item.createdAt}>{runTimeText(item.createdAt)}</time>
                </div>
                <Button
                  onClick={() => {
                    setSelectedResult(item.id);
                    setDialog(undefined);
                  }}
                >
                  Ergebnis anzeigen
                </Button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      {narrow && schemaPanel}
      <div className="sql-panel-host" ref={panelHost}>
        <PanelGroup
          ref={panels}
          direction="vertical"
          className="sql-panels"
          onLayout={(sizes) => {
            if (sizes[0] !== undefined)
              view.patch({sqlEditorFraction: Math.min(0.8, Math.max(0.15, sizes[0] / 100))});
          }}
        >
          <Panel
            defaultSize={layout.sqlEditorFraction * 100}
            minSize={Math.min(45, (180 / panelHeight) * 100)}
          >
            <PanelGroup
              ref={editorPanels}
              direction="horizontal"
              className="sql-editor-row"
              onLayout={(sizes) => {
                if (!narrow && layout.dataPanelVisible && sizes[1] !== undefined)
                  view.patch({sqlSchemaFraction: Math.min(0.45, Math.max(0.1, sizes[1] / 100))});
              }}
            >
              <Panel
                id="sql-editor"
                order={1}
                className="sql-editor-main"
                defaultSize={
                  !narrow && layout.dataPanelVisible ? (1 - layout.sqlSchemaFraction) * 100 : 100
                }
                minSize={!narrow && layout.dataPanelVisible ? (320 / panelWidth) * 100 : 0}
              >
                <CodeEditor
                  models={models}
                  id={analysis.id}
                  kind="sql"
                  code={analysis.code}
                  readOnly={session.readOnly}
                  onChange={(code) => {
                    try {
                      session.updateAnalysis(analysis.id, {code});
                    } catch (e) {
                      report(e, session);
                    }
                  }}
                  onSave={save}
                  onRun={execute}
                  fontSize={settings.editorFontSize}
                  wordWrap={settings.wordWrap}
                  lineNumbers={settings.showLineNumbers}
                  sqlTables={Object.values(session.document.datasets)
                    .filter((dataset) => !dataset.removedAt)
                    .map((dataset) => ({
                      name: dataset.sqlName,
                      columns: session.document.datasetVersions[
                        dataset.currentVersionId
                      ]!.schema.columns.map((column) => ({
                        name: column.name,
                        type: column.logicalType,
                      })),
                    }))}
                />
              </Panel>
              {!narrow && schemaPanel && (
                <>
                  <PanelResizeHandle
                    className="panel-handle horizontal-handle sql-schema-handle"
                    aria-label="Breite von Tabellen & Spalten ändern"
                  />
                  <Panel
                    id="sql-schema"
                    order={2}
                    defaultSize={layout.sqlSchemaFraction * 100}
                    minSize={(220 / panelWidth) * 100}
                    maxSize={45}
                  >
                    {schemaPanel}
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          <PanelResizeHandle
            className="panel-handle sql-result-handle"
            aria-label="Grösse von Editor und Resultat ändern"
          >
            <span aria-hidden="true" />
          </PanelResizeHandle>
          <Panel minSize={Math.min(50, (220 / panelHeight) * 100)}>
            <section className="result-section" aria-label="SQL-Resultat">
              {result?.kind !== 'table' && (
                <Toolbar className="result-toolbar">
                  <RunStatus run={run} />
                </Toolbar>
              )}
              {run?.error && (
                <Notice tone="danger" className="result-error">
                  {run.error.code}: {run.error.message}
                </Notice>
              )}
              {!run && (
                <p className="result-empty">
                  Ausführen oder ⌘/Strg + Enter startet einen neuen Lauf.
                </p>
              )}
              {run?.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              {result?.kind === 'table' && (
                <TableView
                  key={result.id}
                  result={result}
                  session={session}
                  run={run}
                  {...(savedResult ? {onCurrent: () => setSelectedResult(undefined)} : {})}
                />
              )}
              {run && (
                <RunDetails
                  run={run}
                  workspaceDocument={session.document}
                  availability={{
                    mode: session.mode,
                    missingArtifacts: session.integrity?.missing,
                    integrity: session.integrity,
                    hashesChecked: session.hashesChecked,
                  }}
                />
              )}
            </section>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
function parameterRows(parameters: Analysis['parameters']) {
  return Object.entries(parameters).map(([name, value]) => ({
    name,
    type: (value === null
      ? 'null'
      : typeof value === 'object'
        ? value.type
        : typeof value) as ParameterType,
    value: value === null ? '' : typeof value === 'object' ? value.value : String(value),
  }));
}
export function Parameters({
  analysis,
  session,
  onClose,
}: {
  analysis: Analysis;
  session: EditingSession;
  onClose?: () => void;
}) {
  const [rows, setRows] = useState(() => parameterRows(analysis.parameters));
  const [error, setError] = useState('');
  const errorFocusRef = useRef<HTMLButtonElement>(null);
  const form = useFormValidation(
    Object.fromEntries(
      rows.flatMap((row, i) => [
        [
          `name-${i}`,
          () =>
            parameterNameError(
              row.name,
              rows.filter((_, index) => i !== index).map((r) => r.name),
            ),
        ],
        [`value-${i}`, () => parameterValueError(row.type, row.value)],
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);
  const content = (
    <div className="parameters-editor">
      <div className="parameter-table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Typ</th>
              <th scope="col">Wert</th>
              <th scope="col" className="actions">
                <span className="visually-hidden">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <FormField
                    label={`Parameter ${i + 1} Name`}
                    labelHidden
                    error={form.errors[`name-${i}`]}
                  >
                    <Input
                      {...form.control(`name-${i}`)}
                      required
                      aria-label={`Parameter ${i + 1} Name`}
                      disabled={session.readOnly}
                      value={row.name}
                      onChange={(e) => {
                        setDirty(true);
                        form.change(
                          `name-${i}`,
                          parameterNameError(
                            e.target.value,
                            rows.filter((_, j) => i !== j).map((r) => r.name),
                          ),
                        );
                        setRows(rows.map((r, j) => (j === i ? {...r, name: e.target.value} : r)));
                      }}
                    />
                  </FormField>
                </td>
                <td>
                  <Select
                    required
                    aria-label={`Parameter ${i + 1} Typ`}
                    disabled={session.readOnly}
                    value={row.type}
                    onChange={(e) => {
                      setDirty(true);
                      form.change(
                        `value-${i}`,
                        parameterValueError(e.target.value as ParameterType, row.value),
                      );
                      setRows(
                        rows.map((r, j) =>
                          j === i ? {...r, type: e.target.value as ParameterType} : r,
                        ),
                      );
                    }}
                  >
                    {[
                      'string',
                      'number',
                      'boolean',
                      'null',
                      'int64',
                      'decimal',
                      'date',
                      'timestamp',
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                </td>
                <td>
                  <FormField
                    label={`Parameter ${i + 1} Wert`}
                    optional={row.type === 'string'}
                    labelHidden
                    error={form.errors[`value-${i}`]}
                  >
                    <Input
                      {...form.control(`value-${i}`)}
                      required={!['string', 'null'].includes(row.type)}
                      aria-label={`Parameter ${i + 1} Wert`}
                      disabled={session.readOnly || row.type === 'null'}
                      value={row.value}
                      onChange={(e) => {
                        setDirty(true);
                        form.change(`value-${i}`, parameterValueError(row.type, e.target.value));
                        setRows(rows.map((r, j) => (j === i ? {...r, value: e.target.value} : r)));
                      }}
                    />
                  </FormField>
                </td>
                <td className="actions">
                  <Button
                    variant="tertiary"
                    tone="danger"
                    disabled={session.readOnly}
                    aria-label={`Parameter ${i + 1} entfernen`}
                    onClick={() => {
                      setDirty(true);
                      setRows(rows.filter((_, j) => i !== j));
                      form.reset();
                    }}
                  >
                    Entfernen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionGroup>
        <Button
          disabled={session.readOnly}
          onClick={() => {
            setRows([...rows, {name: '', type: 'string', value: ''}]);
            setDirty(true);
          }}
        >
          Parameter hinzufügen
        </Button>
        <Button
          variant="primary"
          disabled={session.readOnly || !dirty}
          onClick={() => {
            setError('');
            try {
              if (!form.validate()) return;
              const parameters = Object.fromEntries(
                rows.map((row) => [row.name, parseParameterValue(row.type, row.value)]),
              );
              session.updateAnalysis(analysis.id, {parameters});
              setDirty(false);
              setError('');
              onClose?.();
            } catch (e) {
              setError(failureMessage(e));
            }
          }}
          ref={errorFocusRef}
        >
          Parameter übernehmen
        </Button>
      </ActionGroup>
      {error && (
        <Notice tone="danger" onDismiss={() => setError('')} dismissFocusRef={errorFocusRef}>
          {error}
        </Notice>
      )}
      {onClose && <Button onClick={onClose}>Abbrechen</Button>}
    </div>
  );
  return onClose ? (
    <Modal title="Parameter" onClose={onClose} showClose={false}>
      <p>
        Parameter sind wechselnde Einzelwerte für dieselbe Abfrage, zum Beispiel{' '}
        <code>WHERE jahr = $jahr</code>. Tabellen- und Spaltennamen bleiben Teil des SQL-Codes.
      </p>
      {content}
    </Modal>
  ) : (
    <details className="parameters dw-compact">
      <summary>
        Parameter ({Object.keys(analysis.parameters).length})
        {dirty && <span className="secondary-text"> (Änderungen noch nicht übernommen)</span>}
      </summary>
      {content}
    </details>
  );
}
function TableView({
  result,
  session,
  run,
  onCurrent,
}: {
  result: TableResult;
  session: EditingSession;
  run: ExecutionRun | undefined;
  onCurrent?: () => void;
}) {
  const service = session.getAnalyses();
  const [transfer, setTransfer] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<{column: string; direction: 'asc' | 'desc'}[]>([]);
  const [rows, setRows] = useState<readonly (readonly unknown[])[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [exportFormat, setExportFormat] = useState<TableExportFormat>();
  const [datasetName, setDatasetName] = useState(result.name);
  const [sqlName, setSqlName] = useState('ergebnis');
  const occupied = Object.values(session.document.datasets).map((d) => d.sqlName);
  const datasetForm = useFormValidation({
    name: () => displayNameError(datasetName, 'Datensatznamen'),
    sqlName: () => sqlNameError(sqlName, occupied),
  });
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const pending = useRef(false);
  const live = useRef(true);
  const actionGeneration = useRef(0);
  const exportController = useRef<AbortController | null>(null);
  const [busyAction, setBusyAction] = useState('');
  useEffect(() => {
    live.current = true;
    setBusyAction('');
    return () => {
      live.current = false;
      actionGeneration.current += 1;
      pending.current = false;
      exportController.current?.abort();
      exportController.current = null;
    };
  }, [service, result.id]);
  const act = (action: string, work: () => Promise<unknown>) => {
    if (pending.current || session.scheduler.getSnapshot()) return;
    const generation = actionGeneration.current;
    pending.current = true;
    setBusyAction(action);
    void Promise.resolve()
      .then(() => {
        if (live.current && generation === actionGeneration.current) return work();
      })
      .catch((cause: unknown) => {
        if (live.current && generation === actionGeneration.current) report(cause, session);
      })
      .finally(() => {
        if (live.current && generation === actionGeneration.current) {
          pending.current = false;
          setBusyAction('');
        }
      });
  };
  // Paging cancellation discards the UI reply only; it must never cancel another engine job.
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    void service
      .page(result.id, {offset, size: 100, sort}, new AbortController().signal)
      .then(
        (page) => {
          if (current) setRows(page.rows);
        },
        (e) => {
          if (current) {
            setError(failureMessage(e));
            setRows([]);
          }
        },
      )
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [service, result.id, offset, sort]);
  const unavailable = result.materialization.kind === 'unavailable';
  const exportResult = (format: TableExportFormat) => {
    if (unavailable) return;
    act(`export-${format}`, async () => {
      const control = new AbortController();
      exportController.current = control;
      try {
        const stream = await service.export(result.id, format, control.signal);
        if (control.signal.aborted || exportController.current !== control || !live.current) {
          await stream.cancel();
          control.signal.throwIfAborted();
          return;
        }
        await downloadStream(
          stream,
          `${result.name}.${format}`,
          tableExportMediaType(format),
          control.signal,
        );
      } finally {
        if (exportController.current === control) exportController.current = null;
      }
    });
  };
  const requestExport = (format: TableExportFormat) => {
    if (unavailable || busy || busyAction) return;
    if (format !== 'parquet' || result.coverage.kind === 'limited') setExportFormat(format);
    else exportResult(format);
  };
  return (
    <>
      <Toolbar className="result-toolbar result-actions">
        {onCurrent && (
          <Button variant="tertiary" onClick={onCurrent}>
            Zum aktuellen Ergebnis
          </Button>
        )}
        <ActionGroup>
          <Button
            disabled={
              !!busy ||
              !!busyAction ||
              unavailable ||
              session.readOnly ||
              result.retention === 'kept'
            }
            busy={busyAction === 'keep'}
            busyLabel="Resultat wird aufbewahrt …"
            onClick={() => {
              if (unavailable || session.readOnly || result.retention === 'kept') return;
              act('keep', () => service.keep(result.id));
            }}
          >
            Aufbewahren
          </Button>
          <Button
            disabled={!!busy || !!busyAction || unavailable || session.readOnly}
            onClick={() => setTransfer(true)}
          >
            In R
          </Button>
        </ActionGroup>
        <SplitButton
          label="CSV exportieren"
          menuLabel="Weitere Exportformate"
          contextKey={result.id}
          disabled={!!busy || !!busyAction || unavailable}
          busy={busyAction === 'export-csv'}
          busyLabel="CSV wird exportiert …"
          onClick={() => requestExport('csv')}
          actions={[
            {
              label: 'Parquet exportieren',
              disabled: !!busy || !!busyAction || unavailable,
              busy: busyAction === 'export-parquet',
              busyLabel: 'Parquet wird exportiert …',
              onSelect: () => requestExport('parquet'),
            },
            {
              label: 'XLSX exportieren',
              disabled: !!busy || !!busyAction || unavailable,
              busy: busyAction === 'export-xlsx',
              busyLabel: 'XLSX wird exportiert …',
              onSelect: () => requestExport('xlsx'),
            },
          ]}
        />
        {busyAction === 'export-xlsx' && (
          <Button icon="stop-fill" onClick={() => exportController.current?.abort()}>
            Export abbrechen
          </Button>
        )}
        <Button
          disabled={unavailable}
          onClick={() => setView(view === 'table' ? 'chart' : 'table')}
        >
          {view === 'table' ? 'Diagramm' : 'Tabelle'}
        </Button>
      </Toolbar>
      {exportFormat && (
        <Modal
          title={`${exportFormat === 'parquet' ? 'Parquet' : exportFormat.toUpperCase()} exportieren`}
          onClose={() => setExportFormat(undefined)}
          showClose={false}
          footer={
            <>
              <Button onClick={() => setExportFormat(undefined)}>Abbrechen</Button>
              <Button
                variant="primary"
                disabled={!!busy || !!busyAction || unavailable}
                onClick={() => {
                  const format = exportFormat;
                  setExportFormat(undefined);
                  exportResult(format);
                }}
              >
                Herunterladen
              </Button>
            </>
          }
        >
          <p>
            Exportiert werden alle {result.rowCount} Zeilen des Ergebnisses „{result.name}“,
            unabhängig von der angezeigten Seite.
          </p>
          {result.coverage.kind === 'limited' && (
            <Notice tone="warning">
              Dieses Ergebnis wurde am App-Limit gekürzt. Die ursprüngliche Gesamtzahl der Zeilen
              ist unbekannt. Der Export enthält nur das begrenzte Ergebnis.
            </Notice>
          )}
          {exportFormat === 'csv' && <p>CSV enthält keine Typinformationen.</p>}
          {exportFormat === 'xlsx' && <p>{XLSX_EXPORT_NOTE}</p>}
        </Modal>
      )}
      {busyAction === 'export-xlsx' && <p role="status">XLSX wird exportiert …</p>}
      {transfer && (
        <TransferToR session={session} resultId={result.id} onClose={() => setTransfer(false)} />
      )}
      {result.coverage.kind === 'limited' && (
        <p className="result-error">
          Das App-Limit hat dieses Resultat gekürzt. Die ursprüngliche Gesamtzahl ist unbekannt.
        </p>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      {view === 'table' ? (
        <>
          <div className="result-grid" aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th scope="col" className="result-row-number">
                    <span className="visually-hidden">Zeile</span>
                  </th>
                  {result.schema.columns.map((col) => (
                    <th
                      scope="col"
                      key={col.name}
                      aria-sort={
                        sort[0]?.column === col.name
                          ? sort[0].direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className={numericColumn(col.logicalType) ? 'numeric' : undefined}
                    >
                      <Button
                        variant="tertiary"
                        aria-label={`Nach ${col.name} sortieren`}
                        onClick={() => {
                          setOffset(0);
                          setSort([
                            {
                              column: col.name,
                              direction:
                                sort[0]?.column === col.name && sort[0].direction === 'asc'
                                  ? 'desc'
                                  : 'asc',
                            },
                          ]);
                        }}
                      >
                        <span className="result-column-name">
                          {col.name}
                          {sort[0]?.column === col.name
                            ? sort[0].direction === 'asc'
                              ? ' ↑'
                              : ' ↓'
                            : ''}
                        </span>
                        <span className="result-column-type">{col.logicalType}</span>
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={offset + i}>
                    <th scope="row" className="result-row-number">
                      {offset + i + 1}
                    </th>
                    {row.map((value, j) => (
                      <td
                        key={j}
                        className={
                          numericColumn(result.schema.columns[j]?.logicalType)
                            ? 'numeric'
                            : undefined
                        }
                      >
                        {value === null ? (
                          <span className="null-cell">NULL</span>
                        ) : (
                          String(value ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ChartControls result={result} session={session} />
      )}
      <Toolbar className="result-toolbar result-footer">
        <span role="status" aria-live="polite">
          {result.rowCount} {result.rowCount === '1' ? 'Zeile' : 'Zeilen'}
          {run?.durationMs === undefined ? '' : ` · ${run.durationMs} ms`}
        </span>
        {view === 'table' && (
          <ActionGroup className="result-paging">
            <Button disabled={offset === 0 || loading} onClick={() => setOffset(offset - 100)}>
              Vorherige Seite
            </Button>
            <span>Seite {Math.floor(offset / 100) + 1} (bis zu 100 Zeilen pro Seite)</span>
            <Button
              disabled={offset + 100 >= Number(result.rowCount) || loading}
              onClick={() => setOffset(offset + 100)}
            >
              Nächste Seite
            </Button>
          </ActionGroup>
        )}
      </Toolbar>
      <details className="result-data">
        <summary>Als Datensatz übernehmen und Schema ansehen</summary>
        <p>
          Das vollständige Resultat wird zuerst aufbewahrt und als neue Dateneinbindung gespeichert.
        </p>
        <FormField label={<>Datensatzname</>} error={datasetForm.errors.name}>
          <Input
            {...datasetForm.control('name')}
            required
            maxLength={120}
            value={datasetName}
            onChange={(e) => {
              setDatasetName(e.target.value);
              datasetForm.change('name', displayNameError(e.target.value, 'Datensatznamen'));
            }}
          />
        </FormField>
        <FormField label={<>SQL-Name</>} error={datasetForm.errors.sqlName}>
          <Input
            {...datasetForm.control('sqlName')}
            required
            value={sqlName}
            onChange={(e) => {
              setSqlName(e.target.value);
              datasetForm.change('sqlName', sqlNameError(e.target.value, occupied));
            }}
          />
        </FormField>
        <Button
          variant="primary"
          disabled={!!busy || !!busyAction || session.readOnly || unavailable}
          busy={busyAction === 'dataset'}
          busyLabel="Datensatz wird gespeichert …"
          onClick={() => {
            if (session.readOnly || unavailable || !datasetForm.validate()) return;
            act('dataset', () => service.asDataset(result.id, datasetName, sqlName));
          }}
        >
          Als Datensatz speichern
        </Button>
        <table>
          <tbody>
            {result.schema.columns.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.logicalType}</td>
                <td>{c.nullable ? 'NULL möglich' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
function ChartControls({result, session}: {result: TableResult; session: EditingSession}) {
  const service = session.getAnalyses();
  const saved = Object.values(session.document.visualizations).filter(
    (v) => v.tableResultId === result.id,
  );
  const [spec, setSpec] = useState<Visualization['spec']>(
    saved[0]?.spec ?? {
      type: 'bar',
      x: result.schema.columns[0]!.name,
      y: result.schema.columns[1]?.name ?? result.schema.columns[0]!.name,
    },
  );
  const [data, setData] = useState<Awaited<ReturnType<typeof service.chartData>>>();
  const [error, setError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  useEffect(() => {
    let current = true;
    setData(undefined);
    setError('');
    void service.chartData(result.id, spec, new AbortController().signal).then(
      (d) => {
        if (current) setData(d);
      },
      (e) => {
        if (current) setError(failureMessage(e));
      },
    );
    return () => {
      current = false;
    };
  }, [service, result.id, spec]);
  return (
    <div className="chart-area">
      <Toolbar className="result-toolbar">
        <dl className="dw-meta-list chart-source">
          <div>
            <dt>Tabellenergebnis</dt>
            <dd>{result.name}</dd>
          </div>
          <div>
            <dt>Erstellt</dt>
            <dd>
              <time dateTime={result.createdAt}>{runTimeText(result.createdAt)}</time>
            </dd>
          </div>
        </dl>
        <FormField label={<>Diagrammtyp</>}>
          <Select
            required
            value={spec.type}
            onChange={(e) =>
              setSpec({...spec, type: e.target.value as Visualization['spec']['type']})
            }
          >
            <option value="bar">Balken</option>
            <option value="line">Linie</option>
            <option value="scatter">Scatter</option>
          </Select>
        </FormField>
        {(['x', 'y', 'color'] as const).map((axis) => (
          <FormField
            key={axis}
            optional={axis === 'color'}
            label={<>{axis === 'color' ? 'Kategorie' : axis.toUpperCase()}</>}
          >
            <Select
              required={axis !== 'color'}
              aria-label={`Diagramm ${axis}`}
              value={spec[axis] ?? ''}
              onChange={(e) => {
                const next = {...spec};
                if (axis === 'color' && !e.target.value) delete next.color;
                else next[axis] = e.target.value;
                setSpec(next);
              }}
            >
              {axis === 'color' && <option value="">Keine</option>}
              {result.schema.columns.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </Select>
          </FormField>
        ))}
        <ActionGroup>
          <Button
            variant="primary"
            disabled={!data || !!error || !!busy || isSaving || session.readOnly}
            busy={isSaving}
            busyLabel="Diagramm wird gespeichert …"
            onClick={() => {
              if (
                saving.current ||
                !data ||
                error ||
                session.scheduler.getSnapshot() ||
                session.readOnly
              )
                return;
              saving.current = true;
              setIsSaving(true);
              void service
                .saveVisualization(result.id, result.name, spec)
                .catch((error: unknown) => report(error, session))
                .finally(() => {
                  saving.current = false;
                  setIsSaving(false);
                });
            }}
          >
            Diagramm speichern
          </Button>
          <Button
            disabled={!data || !!error}
            onClick={() =>
              canvas.current?.toBlob((blob) => {
                if (blob) void downloadStream(blob.stream(), `${result.name}.png`, 'image/png');
              }, 'image/png')
            }
          >
            PNG exportieren
          </Button>
        </ActionGroup>
        {saved.length > 0 && <span>{saved.length} Diagramm(e) gespeichert</span>}
      </Toolbar>
      {error && <Notice tone="danger">{error}</Notice>}
      {data && (
        <Chart canvas={canvas} data={data} spec={spec} title={result.name} onError={setError} />
      )}
    </div>
  );
}

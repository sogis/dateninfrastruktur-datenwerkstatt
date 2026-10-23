import {numericColumn} from '../../ui/table';
import {Button, Input, Select, FormField, ActionGroup, Toolbar, Notice} from '../../ui/Controls';
import {useNameField, useFormValidation} from '../../ui/useFormValidation';
import {displayNameError, sqlNameError} from '../../domain/fieldValidation';
import {SplitButton} from '../../ui/ActionMenu';
import {Modal} from '../../ui/Modal';
import {failureMessage} from '../../application/errors';
import {TransferToR} from '../r/Transfer';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import type {Analysis, SqlAnalysis, TableResult, Visualization} from '../../domain/model';
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
import {usePanelHeight} from '../../ui/PanelLayout';
import type {ImperativePanelGroupHandle} from 'react-resizable-panels';
import {Chart} from './chart';
import {RunDetails, RunStatus, runOptionText, runTimeText} from '../results/RunDetails';

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
  const {ref: panelHost, height: panelHeight} = usePanelHeight();
  useSyncExternalStore(session.persistence.subscribe, () => session.persistence.document);
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const name = useNameField(
    analysis.name,
    'Analysenamen',
    (value) => session.updateAnalysis(analysis.id, {name: value}),
    report,
  );
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const save = () => {
    if (saving.current || session.readOnly || !name.commit()) return;
    saving.current = true;
    setIsSaving(true);
    void session
      .flush()
      .catch(report)
      .finally(() => {
        saving.current = false;
        setIsSaving(false);
      });
  };
  const [selected, setSelected] = useState<string>('latest');
  const runs = Object.values(session.document.runs)
    .filter((r) => r.snapshot.analysisId === analysis.id)
    .reverse()
    .slice(0, 100);
  const run = selected === 'latest' ? runs[0] : runs.find((r) => r.id === selected);
  const result = run?.resultIds[0] ? session.document.results[run.resultIds[0]] : undefined;
  const execute = (selection?: string) => {
    if (!session.scheduler.getSnapshot() && !session.readOnly && name.commit()) {
      setSelected('latest');
      void service.run(analysis.id, selection).catch(report);
    }
  };
  return (
    <div className="analysis-area">
      <Toolbar className="analysis-toolbar">
        <FormField label="Analysename" error={name.error} className="analysis-name-field">
          <Input
            {...name.input}
            disabled={session.readOnly}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && ['s', 'Enter'].includes(event.key)) {
                event.preventDefault();
                if (event.key === 's') save();
                else execute();
              }
            }}
          />
        </FormField>
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
          <Button
            icon="floppy"
            disabled={session.readOnly || isSaving}
            busy={isSaving}
            busyLabel="Änderungen werden gespeichert …"
            onClick={save}
          >
            Speichern
          </Button>
        </ActionGroup>
        <Button
          variant="tertiary"
          aria-pressed={layout.dataPanelVisible}
          onClick={() => view.patch({dataPanelVisible: !layout.dataPanelVisible})}
        >
          Schema
        </Button>
        <span role="status" aria-live={busy ? 'polite' : 'off'}>
          {busy ?? `Revision ${analysis.revision}`}
        </span>
        <Button
          variant="tertiary"
          className="layout-reset"
          icon="arrow-repeat"
          onClick={() => {
            view.reset();
            panels.current?.setLayout([45, 55]);
          }}
        >
          Arbeitsfläche zurücksetzen
        </Button>
      </Toolbar>
      <Parameters key={analysis.id} analysis={analysis} session={session} />
      {layout.dataPanelVisible && (
        <Modal
          title="Datenschema"
          className="schema-drawer"
          onClose={() => view.patch({dataPanelVisible: false})}
          showClose={false}
        >
          <Button onClick={() => view.patch({dataPanelVisible: false})}>Schema schliessen</Button>
          {Object.values(session.document.datasets)
            .filter((d) => !d.removedAt)
            .map((d) => (
              <details key={d.id}>
                <summary>{d.sqlName}</summary>
                <dl className="dw-meta-list schema-columns">
                  {session.document.datasetVersions[d.currentVersionId]!.schema.columns.map((c) => (
                    <div key={c.name}>
                      <dt>{c.name}</dt>
                      <dd>{c.logicalType}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
        </Modal>
      )}
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
                  report(e);
                }
              }}
              onSave={save}
              onRun={execute}
              fontSize={settings.editorFontSize}
              wordWrap={settings.wordWrap}
              lineNumbers={settings.showLineNumbers}
            />
          </Panel>
          <PanelResizeHandle
            className="panel-handle"
            aria-label="Grösse von Editor und Resultat ändern"
          />
          <Panel minSize={Math.min(50, (220 / panelHeight) * 100)}>
            <section className="result-section" aria-label="SQL-Resultat">
              <Toolbar className="result-toolbar">
                <FormField label={<>Lauf</>}>
                  <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <option value="latest">Letzter Lauf</option>
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {runOptionText(r)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {run && <RunStatus run={run} />}
              </Toolbar>
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
                <TableView key={result.id} result={result} session={session} />
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
export function Parameters({analysis, session}: {analysis: Analysis; session: EditingSession}) {
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
  return (
    <details className="parameters dw-compact">
      <summary>
        Parameter ({Object.keys(analysis.parameters).length})
        {dirty && <span className="secondary-text"> (Änderungen noch nicht übernommen)</span>}
      </summary>
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
    </details>
  );
}
function TableView({result, session}: {result: TableResult; session: EditingSession}) {
  const service = session.getAnalyses();
  const [transfer, setTransfer] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<{column: string; direction: 'asc' | 'desc'}[]>([]);
  const [rows, setRows] = useState<readonly (readonly unknown[])[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [datasetName, setDatasetName] = useState(result.name);
  const [sqlName, setSqlName] = useState('ergebnis');
  const occupied = Object.values(session.document.datasets).map((d) => d.sqlName);
  const datasetForm = useFormValidation({
    name: () => displayNameError(datasetName, 'Datensatznamen'),
    sqlName: () => sqlNameError(sqlName, occupied),
  });
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const pending = useRef(false);
  const [busyAction, setBusyAction] = useState('');
  const act = (action: string, work: () => Promise<unknown>) => {
    if (pending.current || session.scheduler.getSnapshot()) return;
    pending.current = true;
    setBusyAction(action);
    void Promise.resolve()
      .then(work)
      .catch(report)
      .finally(() => {
        pending.current = false;
        setBusyAction('');
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
  const exportResult = (format: 'csv' | 'parquet') => {
    if (unavailable) return;
    act(`export-${format}`, () =>
      service
        .export(result.id, format, new AbortController().signal)
        .then((stream) =>
          downloadStream(
            stream,
            `${result.name}.${format}`,
            format === 'csv' ? 'text/csv' : 'application/vnd.apache.parquet',
          ),
        ),
    );
  };
  return (
    <>
      <Toolbar className="result-toolbar">
        <span className="result-name">
          Ergebnis: <strong>{result.name}</strong>
        </span>
        <dl className="dw-meta-list">
          <div>
            <dt>Zeilen</dt>
            <dd>{result.rowCount}</dd>
          </div>
          <div>
            <dt>Umfang</dt>
            <dd>{result.coverage.kind === 'limited' ? 'Begrenzt' : 'Vollständig'}</dd>
          </div>
          <div>
            <dt>Aufbewahrung</dt>
            <dd>{result.retention === 'kept' ? 'Aufbewahrt' : 'Temporär'}</dd>
          </div>
        </dl>
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
          onClick={() => exportResult('csv')}
          actions={[
            {
              label: 'Parquet exportieren',
              disabled: !!busy || !!busyAction || unavailable,
              busy: busyAction === 'export-parquet',
              busyLabel: 'Parquet wird exportiert …',
              onSelect: () => exportResult('parquet'),
            },
          ]}
        />
        <Button
          disabled={unavailable}
          onClick={() => setView(view === 'table' ? 'chart' : 'table')}
        >
          {view === 'table' ? 'Diagramm' : 'Tabelle'}
        </Button>
      </Toolbar>
      <p className="export-note">
        CSV enthält keine Typinformationen. Exportiert werden alle Zeilen des bezeichneten
        Ergebnisses.
      </p>
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
                        {col.name}
                        {sort[0]?.column === col.name
                          ? sort[0].direction === 'asc'
                            ? ' ↑'
                            : ' ↓'
                          : ''}
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={offset + i}>
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
          <Toolbar className="result-toolbar">
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
          </Toolbar>
        </>
      ) : (
        <ChartControls result={result} session={session} />
      )}
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
                .catch(report)
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

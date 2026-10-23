import {RTableExport} from './RTableExport';
import {Button, Input, Select, FormField, ActionGroup, Toolbar, Notice} from '../../ui/Controls';
import {useNameField, useFormValidation} from '../../ui/useFormValidation';
import {displayNameError, sqlNameError} from '../../domain/fieldValidation';
import {ActionMenu} from '../../ui/ActionMenu';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import type {RAnalysis, RunId, DatasetId, PlotResult} from '../../domain/model';
import type {EditingSession} from '../../application/workspaceService';
import type {RObjectRef, TransferPlan} from '../../application/ports';
import type {CodeModels} from '../../infrastructure/monaco/models';
import type {Settings} from '../../infrastructure/storage/settings';
import {CodeEditor} from '../../ui/CodeEditor';
import {Modal} from '../../ui/Modal';
import {Parameters} from '../sql/SqlWorkbench';
import {PlanView, approvalChecks} from './Transfer';
import {report} from '../../app/router';
import {downloadStream} from '../../app/download';
import {PreviewTable} from '../data/DataSection';
import {useWorkspace} from '../../app/router';
import {useStore} from 'zustand';
import type {ImperativePanelGroupHandle} from 'react-resizable-panels';
import {RunDetails, runStatusText, runTimeText} from '../results/RunDetails';
export function RWorkbench({
  session,
  analysis,
  models,
  settings,
}: {
  session: EditingSession;
  analysis: RAnalysis;
  models: CodeModels;
  settings: Settings;
}) {
  const service = session.getR();
  useSyncExternalStore(service.subscribe, service.getSnapshot);
  useSyncExternalStore(session.persistence.subscribe, () => session.persistence.document);
  const busy = useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const started = useRef(false);
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
  const [selected, setSelected] = useState('latest');
  const {view} = useWorkspace();
  const layout = useStore(view.store, (s) => s.value);
  const consoleOpen = layout.rConsoleVisible,
    objectsOpen = layout.rObjectsVisible;
  const columns = useRef<ImperativePanelGroupHandle>(null),
    rows = useRef<ImperativePanelGroupHandle>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reset, setReset] = useState(false);
  const [object, setObject] = useState<RObjectRef>();
  const [plan, setPlan] = useState<TransferPlan>();
  const [approved, setApproved] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState('vergleich');
  const [sqlName, setSqlName] = useState('vergleich');
  const [replace, setReplace] = useState<string>('new');
  const occupied = Object.values(session.document.datasets)
    .filter((d) => d.id !== replace)
    .map((d) => d.sqlName);
  const datasetForm = useFormValidation({
    ...approvalChecks(plan, approved),
    name: () => displayNameError(datasetName, 'Datensatznamen'),
    sqlName: () => (replace === 'new' ? sqlNameError(sqlName, occupied) : undefined),
  });
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof service.previewObject>>>();
  useEffect(() => {
    setPreview(undefined);
    setObject(undefined);
    setPlan(undefined);
  }, [service.epoch, service.scope?.key]);
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
  useEffect(() => {
    if (!started.current && !session.readOnly) {
      started.current = true;
      void service.activate(analysis.id).catch(report);
    }
  }, [service, session, analysis.id]);
  const runs = Object.values(session.document.runs)
    .filter((r) => r.snapshot.analysisId === analysis.id)
    .reverse()
    .slice(0, 100);
  const run = selected === 'latest' ? runs[0] : runs.find((r) => r.id === selected);
  const plots =
    run?.resultIds
      .map((id) => session.document.results[id])
      .filter((r): r is PlotResult => r?.kind === 'plot') ?? [];
  const execute = (selection?: string) => {
    if (pending.current || session.scheduler.getSnapshot() || session.readOnly || !name.commit())
      return;
    setSelected('latest');
    setPreview(undefined);
    void service.run(analysis.id, selection).catch(report);
  };
  return (
    <div className="analysis-area r-workbench">
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
            busy={busy?.startsWith('R ') ?? false}
            busyLabel="R wird ausgeführt …"
            disabled={!!busy || !!busyAction || session.readOnly}
            onClick={() => execute()}
          >
            Ausführen
          </Button>
          {busy?.startsWith('R ') && (
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
        <ActionGroup>
          <Button
            variant="tertiary"
            aria-pressed={objectsOpen}
            onClick={() => view.patch({rObjectsVisible: !objectsOpen})}
          >
            Objekte / Eingaben
          </Button>
          <Button
            variant="tertiary"
            aria-pressed={consoleOpen}
            onClick={() => view.patch({rConsoleVisible: !consoleOpen})}
          >
            Konsole
          </Button>
        </ActionGroup>
        <ActionMenu
          contextKey={analysis.id}
          actions={[
            {label: 'R-Optionen', onSelect: () => setOptionsOpen(true)},
            {
              label: 'Arbeitsfläche zurücksetzen',
              icon: 'arrow-repeat',
              onSelect: () => {
                view.reset();
                columns.current?.setLayout([50, 50]);
                rows.current?.setLayout([75, 25]);
              },
            },
            {
              label: 'R zurücksetzen',
              separatorBefore: true,
              disabled: !!busy || !!busyAction || session.readOnly,
              variant: 'tertiary',
              tone: 'danger',
              onSelect: () => setReset(true),
            },
          ]}
        />
        {optionsOpen && (
          <Modal title="R-Optionen" onClose={() => setOptionsOpen(false)}>
            <FormField label={<>Umgebung</>}>
              <Select
                required
                value={analysis.environmentMode}
                disabled={!!busy || session.readOnly}
                onChange={(e) =>
                  session.updateAnalysis(analysis.id, {
                    environmentMode: e.target.value as RAnalysis['environmentMode'],
                  })
                }
              >
                <option value="workspace-session">Projektsitzung</option>
                <option value="fresh-environment">Frisches Environment</option>
              </Select>
            </FormField>
            <FormField label={<>Zufallsseed</>} optional>
              <Input
                type="number"
                disabled={!!busy || session.readOnly}
                min="0"
                max="2147483647"
                defaultValue={analysis.randomSeed ?? ''}
                onBlur={(e) => {
                  try {
                    session.updateAnalysis(analysis.id, {
                      randomSeed: e.target.value === '' ? null : Number(e.target.value),
                    });
                  } catch (error) {
                    report(error);
                  }
                }}
              />
            </FormField>
            <p>Ein frisches Environment ist keine Prozessisolation.</p>
          </Modal>
        )}
      </Toolbar>
      <div className="run-status dw-compact">
        <Parameters analysis={analysis} session={session} />
        <FormField label={<>R-Lauf</>}>
          <Select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setPreview(undefined);
              const id = e.target.value === 'latest' ? runs[0]?.id : (e.target.value as RunId);
              if (id) void service.selectRun(id).catch(report);
            }}
          >
            <option value="latest">Letzter Lauf</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {runTimeText(r.queuedAt)} · {runStatusText(r)}
              </option>
            ))}
          </Select>
        </FormField>
        <span>{busy ?? (run ? runStatusText(run) : 'Bereit')}</span>
        {!service.scope && !busy && !session.readOnly && (
          <Button
            busy={busyAction === 'activate'}
            busyLabel="R wird initialisiert …"
            onClick={() => act('activate', () => service.activate(analysis.id))}
          >
            R initialisieren
          </Button>
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
      </div>
      {run?.error && (
        <Notice tone="danger" className="result-error">
          {run.error.code}: {run.error.message}
        </Notice>
      )}
      {run?.warnings.map((w) => (
        <Notice key={w} tone="info">
          {w}
        </Notice>
      ))}
      <PanelGroup
        ref={rows}
        direction="vertical"
        className="r-panels"
        onLayout={(sizes) => {
          if (sizes.length === 2 && sizes[1] !== undefined)
            view.patch({rConsoleFraction: Math.min(0.6, Math.max(0.12, sizes[1] / 100))});
        }}
      >
        <Panel
          id="r-main"
          order={1}
          defaultSize={consoleOpen ? (1 - layout.rConsoleFraction) * 100 : 100}
          minSize={40}
        >
          <div className="r-upper">
            {objectsOpen && (
              <aside className="r-objects">
                <h3>R-Sitzungsobjekte</h3>
                <p>
                  Objekte des angezeigten R-Sitzungsscopes. Eine Übernahme sichert ihren aktuellen
                  Stand als Ergebnis und Datensatz.
                </p>
                <details>
                  <summary>Technischer Sitzungsscope</summary>
                  <p>
                    Scope <code>{service.scope?.key ?? 'nicht aktiv'}</code> · R-Epoche{' '}
                    {service.epoch}
                  </p>
                </details>
                <ActionGroup>
                  {service.objectList.map((o) => (
                    <Button
                      key={o.ref.name}
                      disabled={!!busy || !!busyAction || !o.isDataFrame}
                      busy={busyAction === `preview-${o.ref.name}`}
                      busyLabel="Objekt wird geladen …"
                      onClick={() => {
                        if (pending.current || session.scheduler.getSnapshot() || !o.isDataFrame)
                          return;
                        setObject(o.ref);
                        setPlan(undefined);
                        setDatasetName(o.ref.name);
                        setSqlName(o.ref.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                        act(`preview-${o.ref.name}`, () =>
                          service
                            .previewObject(o.ref, new AbortController().signal)
                            .then(setPreview),
                        );
                      }}
                    >
                      {o.ref.name} ·{' '}
                      {o.isDataFrame ? `${o.rowCount} × ${o.columnCount}` : o.classes.join(', ')}
                    </Button>
                  ))}
                </ActionGroup>
                <h3>Eingaben</h3>
                {analysis.inputs.map((i) => (
                  <p key={i.name}>
                    <code>{i.name}</code> · {i.source.kind}
                  </p>
                ))}
                {object && (
                  <Button
                    disabled={!!busy || !!busyAction || session.readOnly}
                    busy={busyAction === 'plan'}
                    busyLabel="Übernahme wird geprüft …"
                    onClick={() => {
                      if (session.readOnly) return;
                      setApproved([]);
                      act('plan', () =>
                        service.planFromR(object, new AbortController().signal).then(setPlan),
                      );
                    }}
                  >
                    Objekt als Datensatz
                  </Button>
                )}
              </aside>
            )}
            {
              <PanelGroup
                ref={columns}
                direction="horizontal"
                onLayout={(sizes) => {
                  if (sizes[0] !== undefined) view.patch({rEditorFraction: sizes[0] / 100});
                }}
              >
                <Panel defaultSize={layout.rEditorFraction * 100} minSize={25}>
                  <CodeEditor
                    models={models}
                    id={analysis.id}
                    kind="r"
                    code={analysis.code}
                    readOnly={session.readOnly}
                    onChange={(code) => session.updateAnalysis(analysis.id, {code})}
                    onSave={save}
                    onRun={execute}
                    fontSize={settings.editorFontSize}
                    wordWrap={settings.wordWrap}
                    lineNumbers={settings.showLineNumbers}
                  />
                </Panel>
                <PanelResizeHandle
                  className="panel-handle horizontal-handle"
                  aria-label="R Editor und Ausgabe teilen"
                />
                <Panel minSize={25}>
                  <div className="r-output">
                    {preview ? (
                      <>
                        <Button onClick={() => setPreview(undefined)}>Grafiken anzeigen</Button>
                        {object && (
                          <RTableExport
                            key={`${object.scope.key}-${object.scope.engineEpoch}-${object.name}`}
                            session={session}
                            object={object}
                          />
                        )}
                        <PreviewTable preview={preview} />
                      </>
                    ) : plots.length ? (
                      plots.map((plot) => <Plot key={plot.id} session={session} result={plot} />)
                    ) : (
                      <p>
                        Grafikergebnisse dieses Laufes erscheinen nach einer erfolgreichen
                        Ausführung. Dataframes der R-Sitzung sind über die R-Sitzungsobjekte
                        erreichbar.
                      </p>
                    )}
                  </div>
                </Panel>
              </PanelGroup>
            }
          </div>
        </Panel>
        {consoleOpen && (
          <>
            <PanelResizeHandle className="panel-handle" aria-label="R Konsole teilen" />
            <Panel
              id="r-console"
              order={2}
              defaultSize={layout.rConsoleFraction * 100}
              minSize={12}
            >
              <div className="r-console" role="log" aria-label="R-Konsole">
                {run ? (
                  service.console(run.id).map((line, i) => (
                    <pre key={i} data-kind={line.kind}>
                      <strong>{line.kind}</strong> {line.text}
                    </pre>
                  ))
                ) : (
                  <p>
                    Ausgabe, Meldungen und Warnungen. print()/cat() für explizite Ausgabe verwenden.
                  </p>
                )}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
      {reset && (
        <Modal
          title="R-Sitzung zurücksetzen?"
          onClose={() => {
            if (!pending.current) setReset(false);
          }}
          footer={
            <>
              <Button
                variant="primary"
                tone="danger"
                disabled={!!busy || !!busyAction || session.readOnly}
                busy={busyAction === 'reset'}
                busyLabel="R wird zurückgesetzt …"
                onClick={() => {
                  if (session.readOnly) return;
                  act('reset', () =>
                    service.reset().then(() => {
                      setReset(false);
                      setPreview(undefined);
                      setObject(undefined);
                    }),
                  );
                }}
              >
                Reset bestätigen
              </Button>
            </>
          }
        >
          <p>
            {service.objectList.length} ungesicherte Objekte werden verworfen. Gespeicherter Code,
            Daten und SQL-Resultate bleiben erhalten.
          </p>
        </Modal>
      )}
      {plan && (
        <Modal
          title="R-Objekt nach SQL übernehmen"
          onClose={() => {
            if (!pending.current) setPlan(undefined);
          }}
          footer={
            <>
              <Button
                variant="primary"
                disabled={!!busy || !!busyAction || session.readOnly}
                busy={busyAction === 'commit'}
                busyLabel="Datensatz wird übernommen …"
                onClick={() => {
                  if (session.readOnly || !datasetForm.validate()) return;
                  act('commit', () =>
                    service
                      .commitFromR(plan.id, datasetName, approved, new AbortController().signal, {
                        sqlName,
                        ...(replace === 'new' ? {} : {replace: replace as DatasetId}),
                      })
                      .then(() => setPlan(undefined)),
                  );
                }}
              >
                Datensatz übernehmen
              </Button>
            </>
          }
        >
          <PlanView
            plan={plan}
            approved={approved}
            onChange={setApproved}
            validation={datasetForm}
          />
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
          <FormField label={<>Zieldatensatz</>}>
            <Select
              required
              value={replace}
              onChange={(e) => {
                setReplace(e.target.value);
                datasetForm.reset();
              }}
            >
              <option value="new">Neuer Datensatz</option>
              {Object.values(session.document.datasets)
                .filter((d) => !d.removedAt)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ersetzen
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label={<>SQL-Name</>} error={datasetForm.errors.sqlName}>
            <Input
              {...datasetForm.control('sqlName')}
              required={replace === 'new'}
              value={
                replace === 'new'
                  ? sqlName
                  : (session.document.datasets[replace as DatasetId]?.sqlName ?? '')
              }
              disabled={replace !== 'new'}
              onChange={(e) => {
                setSqlName(e.target.value);
                datasetForm.change('sqlName', sqlNameError(e.target.value, occupied));
              }}
            />
          </FormField>
        </Modal>
      )}
    </div>
  );
}
function Plot({session, result}: {session: EditingSession; result: PlotResult}) {
  const [url, setUrl] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [busyAction, setBusyAction] = useState('');
  const act = (action: string, work: () => Promise<unknown>) => {
    if (pending.current) return;
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
  useEffect(() => {
    let live = true;
    let objectUrl = '';
    void session
      .getR()
      .plot(result.id, new AbortController().signal)
      .then((blob) => {
        if (live) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(report);
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [session, result.id]);
  return (
    <div ref={container} className="r-plot">
      {url && <img src={url} alt={result.name} />}
      <ActionGroup className="dw-compact">
        <Button
          icon="arrows-fullscreen"
          onClick={() => void container.current?.requestFullscreen().catch(report)}
        >
          Grafik Vollbild
        </Button>
        <Button
          disabled={!!busyAction}
          busy={busyAction === 'export'}
          busyLabel="PNG wird heruntergeladen …"
          onClick={() =>
            act('export', () =>
              session
                .getR()
                .plot(result.id, new AbortController().signal)
                .then((blob) => downloadStream(blob.stream(), 'r-grafik.png', 'image/png')),
            )
          }
        >
          PNG herunterladen
        </Button>
        <Button
          disabled={!!busyAction || session.readOnly || result.retention === 'kept'}
          busy={busyAction === 'keep'}
          busyLabel="Grafik wird aufbewahrt …"
          onClick={() => {
            if (session.readOnly || result.retention === 'kept') return;
            act('keep', () => session.getR().keepPlot(result.id));
          }}
        >
          Grafik aufbewahren
        </Button>
      </ActionGroup>
    </div>
  );
}

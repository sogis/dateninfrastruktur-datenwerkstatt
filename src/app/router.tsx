import {
  Button,
  IconButton,
  Input,
  Select,
  FormField,
  Notice,
} from '../ui/Controls';
import {NavigationItem} from '../ui/NavigationItem';
import {StorageSettings} from '../features/workspaces/StorageSettings';
import {WorkspaceViewController} from '../state/workspaceView';
import {failureMessage} from '../application/errors';
import {RWorkbench} from '../features/r/RWorkbench';
import {PortalOpen} from '../features/catalog/PortalImport';
import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
  useBlocker,
  useRouterState,
  useRouter,
} from '@tanstack/react-router';
import {useStore} from 'zustand';
import logo from '../assets/kanton-solothurn.svg';
import {services} from './services';
import {appStore} from '../state/appStore';
import {createWorkspaceStore} from '../state/workspaceStore';
import {CodeModels} from '../infrastructure/monaco/models';
import type {EditingSession} from '../application/workspaceService';
import type {AnalysisId} from '../domain/model';
import {checkedId} from '../domain/workspace';
import {SqlWorkbench} from '../features/sql/SqlWorkbench';
import {ProjectList, ProjectOverview} from '../features/workspaces/Workspaces';
import {ProjectDataPage} from '../features/data/DataSection';
function message(error: unknown) {
  return failureMessage(error);
}
export function report(error: unknown) {
  appStore.setState({error: message(error)});
}
const rootRoute = createRootRoute({
  component: Shell,
  errorComponent: ({error}) => (
    <div role="alert">
      <h1>Projekt konnte nicht geöffnet werden</h1>
      <p>{message(error)}</p>
      <Link to="/projects">Projekte</Link>
    </div>
  ),
  notFoundComponent: () => (
    <main>
      <h1>Nicht gefunden</h1>
      <Link to="/projects">Projekte</Link>
    </main>
  ),
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({to: '/projects'});
  },
});
export const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  loader: async () => {
    await services.workspaces.close();
    return services.workspaces.list();
  },
  component: ProjectList,
});
export const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$workspaceId',
  loader: ({params}) => services.workspaces.open(params.workspaceId),
  component: WorkspaceProvider,
});
const detailRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: ProjectOverview,
});
const dataRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'data',
  component: ProjectDataPage,
});
const sqlRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'sql/$analysisId',
  component: () => <AnalysisPage kind="sql" analysisId={sqlRoute.useParams().analysisId} />,
});
const rRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'r/$analysisId',
  component: () => <AnalysisPage kind="r" analysisId={rRoute.useParams().analysisId} />,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  loader: async () => {
    await services.workspaces.close();
  },
  component: SettingsPage,
});
const openRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/open',
  loader: () => services.workspaces.close(),
  component: PortalOpen,
});
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    openRoute,
    listRoute,
    workspaceRoute.addChildren([detailRoute, dataRoute, sqlRoute, rRoute]),
    settingsRoute,
  ]),
  basepath: import.meta.env.BASE_URL,
  defaultPreload: false,
  defaultPendingMs: 0,
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
function Shell() {
  const error = useStore(appStore, (s) => s.error);
  const defaultCollapsed = useStore(appStore, (s) => s.settings.sidebarCollapsed);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>();
  const expanded = !(sidebarCollapsed ?? defaultCollapsed);
  const inWorkspace = useRouterState({
    select: (s) => s.matches.some((match) => match.routeId === workspaceRoute.id),
  });
  useEffect(() => {
    void services.settings
      .load()
      .then((settings) => appStore.setState({settings}))
      .catch(report);
  }, []);
  return (
    <>
      <header className="app-header">
        <img src={logo} alt="Kanton Solothurn" />
        <Link to="/projects" className="brand">
          Datenwerkstatt
        </Link>
        {services.mode === 'temporary' && (
          <span className="build-status">Nur diese Sitzung · Verlust bei Reload</span>
        )}
      </header>
      {error && (
        <div role="alert" className="error app-error">
          <span className="app-error-message">{error}</span>
          <IconButton
            icon="x-lg"
            label="Hinweis schliessen"
            variant="ghost"
            onClick={() => appStore.setState({error: null})}
          />
        </div>
      )}
      {inWorkspace ? (
        <Outlet />
      ) : (
        <div className="workspace-layout">
          <AppNavigation expanded={expanded} onToggle={() => setSidebarCollapsed(expanded)} />
          <section className="workspace-content">
            <Outlet />
          </section>
        </div>
      )}
    </>
  );
}
function AppNavigation({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const routeId = useRouterState({select: (s) => s.matches.at(-1)?.routeId});
  return (
    <nav className={expanded ? 'sidebar expanded' : 'sidebar'} aria-label="Hauptnavigation">
      <NavigationItem
        icon="layout-sidebar"
        label={expanded ? 'Navigation einklappen' : 'Navigation ausklappen'}
        expanded={expanded}
      >
        <Button onClick={onToggle} />
      </NavigationItem>
      <NavigationItem
        icon="collection"
        label="Projekte"
        expanded={expanded}
        current={routeId === listRoute.id}
      >
        <Link to="/projects" activeOptions={{exact: true}} />
      </NavigationItem>
      {children}
      <NavigationItem
        icon="gear"
        label="Einstellungen"
        expanded={expanded}
        current={routeId === settingsRoute.id}
      >
        <Link to="/settings" activeOptions={{exact: true}} />
      </NavigationItem>
    </nav>
  );
}
interface Context {
  session: EditingSession;
  state: ReturnType<typeof createWorkspaceStore>;
  models: CodeModels;
  view: WorkspaceViewController;
}
const workspaceContext = createContext<Context | null>(null);
export function useWorkspace() {
  const ctx = useContext(workspaceContext);
  if (!ctx) throw Error('Projekt fehlt.');
  return ctx;
}
function WorkspaceProvider() {
  const session = workspaceRoute.useLoaderData();
  const ctx = useMemo(
    () => ({
      session,
      state: createWorkspaceStore(session),
      models: new CodeModels(session.sessionId),
      view: new WorkspaceViewController(
        services.views,
        session.document.workspace.id,
        report,
        appStore.getState().settings.sidebarCollapsed,
      ),
    }),
    [session],
  );
  useEffect(() => {
    const unsubscribe = ctx.state.connect();
    void ctx.view.load();
    return () => {
      unsubscribe();
      ctx.models.dispose();
      void ctx.view.flush();
    };
  }, [ctx]);
  const state = useStore(ctx.state.store, (s) => s.saveState);
  const error = useStore(ctx.state.store, (s) => s.error);
  const routeId = useRouterState({select: (s) => s.matches.at(-1)?.routeId});
  const inAnalysis = routeId === sqlRoute.id || routeId === rRoute.id;
  const view = useStore(ctx.view.store, (s) => s.value);
  const expanded = !view.sidebarCollapsed;
  const openAnalysis = (kind: 'sql' | 'r') => {
    const ids = [view.activeAnalysisId, ...view.openAnalysisIds.slice().reverse()];
    const saved = ids.find(
      (id) =>
        id &&
        session.document.analyses[id]?.kind === kind &&
        !session.document.analyses[id]?.archivedAt,
    );
    if (!saved && session.readOnly) return;
    const id = saved ?? session.createAnalysis(kind);
    void routerApi
      .navigate({
        to:
          kind === 'sql'
            ? '/projects/$workspaceId/sql/$analysisId'
            : '/projects/$workspaceId/r/$analysisId',
        params: {workspaceId: session.document.workspace.id, analysisId: id},
      })
      .catch(report);
  };
  const routerApi = useRouter();
  useBlocker({
    enableBeforeUnload: () =>
      session.persistence.generation !== session.persistence.savedGeneration,
    shouldBlockFn: async ({next}) => {
      if (
        [workspaceRoute.id, detailRoute.id, dataRoute.id, sqlRoute.id, rRoute.id].some(
          (id) => id === next.routeId,
        ) &&
        'workspaceId' in next.params &&
        next.params.workspaceId === session.document.workspace.id
      )
        return false;
      try {
        await session.flush();
        return false;
      } catch (error) {
        report(error);
        return true;
      }
    },
  });
  return (
    <workspaceContext.Provider value={ctx}>
      <div className="workspace-layout">
        <AppNavigation
          expanded={expanded}
          onToggle={() => ctx.view.patch({sidebarCollapsed: expanded})}
        >
          <NavigationItem
            icon="folder2-open"
            label="Übersicht"
            expanded={expanded}
            current={routeId === detailRoute.id}
          >
            <Link
              to="/projects/$workspaceId"
              activeOptions={{exact: true}}
              params={{workspaceId: session.document.workspace.id}}
            />
          </NavigationItem>
          <NavigationItem
            icon="table"
            label="Daten"
            expanded={expanded}
            current={routeId === dataRoute.id}
          >
            <Link
              to="/projects/$workspaceId/data"
              activeOptions={{exact: true}}
              params={{workspaceId: session.document.workspace.id}}
            />
          </NavigationItem>
          <NavigationItem
            icon="database"
            label="SQL"
            tooltip="SQL · DuckDB"
            expanded={expanded}
            current={routeId === sqlRoute.id}
          >
            <Button onClick={() => openAnalysis('sql')} />
          </NavigationItem>
          <NavigationItem
            icon="bar-chart-line"
            label="R"
            tooltip="R · webR"
            expanded={expanded}
            current={routeId === rRoute.id}
          >
            <Button onClick={() => openAnalysis('r')} />
          </NavigationItem>
        </AppNavigation>
        <section className="workspace-content" data-analysis={inAnalysis} data-save-state={state}>
          {(session.readOnly || session.mode === 'temporary' || state !== 'saved') && (
            <div className="save-status" aria-live="polite">
              {session.readOnly
                ? 'Nur lesend · Schreibrecht liegt in einem anderen Tab oder Web Locks fehlen.'
                : state === 'saved'
                  ? 'Nur diese Sitzung · kein Backup'
                  : state === 'saving'
                    ? 'Speichert …'
                    : state === 'error'
                      ? 'Speichern fehlgeschlagen'
                      : 'Nicht gespeichert'}
              {session.readOnly && (
                <Button
                  onClick={() => {
                    void services.workspaces
                      .reacquire(session.document.workspace.id)
                      .then(() => routerApi.invalidate())
                      .catch(report);
                  }}
                >
                  Schreibrecht erneut anfordern
                </Button>
              )}
            </div>
          )}
          {error !== undefined && (
            <div className="error" role="alert">
              {message(error)}{' '}
              <Button
                onClick={() => {
                  if (session.persistence.generation === session.persistence.savedGeneration)
                    session.persistence.acknowledgeUnpublishedFailure();
                  else void session.flush().catch(report);
                }}
              >
                {session.persistence.generation === session.persistence.savedGeneration
                  ? 'Vorherigen Projektstand beibehalten'
                  : 'Speichern erneut versuchen'}
              </Button>
            </div>
          )}
          <Outlet />
        </section>
      </div>
    </workspaceContext.Provider>
  );
}
function AnalysisPage({kind, analysisId}: {kind: 'sql' | 'r'; analysisId: string}) {
  const {session, state, models, view} = useWorkspace();
  const ready = useStore(view.store, (s) => s.ready);
  useEffect(() => {
    if (!ready || !session.document.analyses[analysisId as AnalysisId]) return;
    const id = analysisId as AnalysisId,
      current = view.store.getState().value;
    view.patch({
      activeAnalysisId: id,
      openAnalysisIds: [...current.openAnalysisIds.filter((x) => x !== id), id],
      ...(current.openAnalysisIds.length ? {} : {sidebarCollapsed: true}),
    });
  }, [analysisId, ready, session, view]);
  const doc = useStore(state.store, (s) => s.document);
  let id;
  try {
    id = checkedId<'analysis'>(analysisId);
  } catch {
    return <h1>Analyse nicht gefunden</h1>;
  }
  const analysis = doc.analyses[id];
  if (!analysis || analysis.kind !== kind || analysis.archivedAt)
    return <h1>Analyse nicht gefunden</h1>;
  if (!ready) return <Notice tone="info">Arbeitsfläche wird geladen …</Notice>;
  return <AnalysisEditor key={id} analysisId={id} models={models} session={session} />;
}
function AnalysisEditor({
  analysisId,
  models,
  session,
}: {
  analysisId: AnalysisId;
  models: CodeModels;
  session: EditingSession;
}) {
  const {state} = useWorkspace();
  const analysis = useStore(state.store, (s) => s.document.analyses[analysisId])!;
  const settings = useStore(appStore, (s) => s.settings);
  return analysis.kind === 'sql' ? (
    <SqlWorkbench session={session} analysis={analysis} models={models} settings={settings} />
  ) : (
    <RWorkbench session={session} analysis={analysis} models={models} settings={settings} />
  );
}

function SettingsPage() {
  const settings = useStore(appStore, (s) => s.settings);
  const [saveState, setSaveState] = useState('Einstellungen gespeichert');
  const save = (next: typeof settings) => {
    appStore.setState({settings: next});
    setSaveState('Einstellungen werden gespeichert …');
    void services.settings
      .save(next)
      .then(() => {
        if (appStore.getState().settings === next) setSaveState('Einstellungen gespeichert');
      })
      .catch((error) => {
        setSaveState('Speichern fehlgeschlagen');
        report(error);
      });
  };
  return (
    <main className="settings-page">
      <h1>Einstellungen</h1>
      <div className="form-fields">
        <FormField label={<>Editor-Schriftgrösse</>}>
          <Select
            required
            value={settings.editorFontSize}
            onChange={(e) => save({...settings, editorFontSize: Number(e.target.value)})}
          >
            {Array.from({length: 11}, (_, i) => i + 12).map((n) => (
              <option key={n} value={n}>
                {n} px
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={<>Zeilennummern</>}>
          <Input
            type="checkbox"
            checked={settings.showLineNumbers}
            onChange={(e) => save({...settings, showLineNumbers: e.target.checked})}
          />
        </FormField>
        <FormField label={<>Zeilenumbruch</>}>
          <Input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(e) => save({...settings, wordWrap: e.target.checked})}
          />
        </FormField>
      </div>
      <Notice tone="info">{saveState}</Notice>
      <FormField label={<>Seitenleiste standardmässig eingeklappt</>}>
        <Input
          type="checkbox"
          checked={settings.sidebarCollapsed}
          onChange={(e) => save({...settings, sidebarCollapsed: e.target.checked})}
        />
      </FormField>
      <StorageSettings />
    </main>
  );
}

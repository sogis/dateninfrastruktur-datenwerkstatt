import {ActionMenu, MenuButton} from '../../ui/ActionMenu';
import {
  Button,
  Input,
  Textarea,
  FormField,
  ActionGroup,
  EmptyState,
  StatusBadge,
  PanelHeader,
  Tooltip,
} from '../../ui/Controls';
import {Diagnostics} from './Diagnostics';
import {ArchiveActions, ArchiveImport} from '../archive/ArchiveActions';
import {useRef, useState} from 'react';
import {Link, useNavigate} from '@tanstack/react-router';
import {useStore} from 'zustand';
import {listRoute, useWorkspace, report} from '../../app/router';
import {services} from '../../app/services';
import {useNameField} from '../../ui/useFormValidation';
export function ProjectList() {
  const workspaces = listRoute.useLoaderData();
  const name = useNameField('', 'Projektnamen', () => {});
  const [busy, setBusy] = useState(false);
  const creating = useRef(false);
  const navigate = useNavigate();
  return (
    <main>
      <h1>Projekte</h1>
      <form
        noValidate
        className="create-workspace"
        onSubmit={(e) => {
          e.preventDefault();
          if (creating.current || !services.workspaces.canCreate || !name.commit()) return;
          creating.current = true;
          setBusy(true);
          void services.workspaces
            .create(name.value)
            .then((d) =>
              navigate({to: '/projects/$workspaceId', params: {workspaceId: d.workspace.id}}),
            )
            .catch(report)
            .finally(() => {
              creating.current = false;
              setBusy(false);
            });
        }}
      >
        <FormField label={<>Name des neuen Projekts</>} error={name.error}>
          <Input {...name.input} />
        </FormField>
        <Button
          type="submit"
          variant="primary"
          icon="plus-lg"
          busy={busy}
          busyLabel="Projekt wird erstellt …"
          disabled={busy || !services.workspaces.canCreate}
        >
          Neues Projekt
        </Button>
      </form>
      <ArchiveImport />
      {workspaces.length === 0 ? (
        <EmptyState>
          Noch kein Projekt. Lege ein Projekt an oder öffne eine Projektdatei.
        </EmptyState>
      ) : (
        <table className="workspace-list">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col" className="numeric">
                Daten
              </th>
              <th scope="col" className="numeric">
                Analysen
              </th>
              <th scope="col">Zuletzt bearbeitet</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id}>
                <td>
                  <Link to="/projects/$workspaceId" params={{workspaceId: w.id}}>
                    {w.name}
                  </Link>
                </td>
                <td className="numeric">{w.datasetCount}</td>
                <td className="numeric">{w.analysisCount}</td>
                <td>
                  <Tooltip
                    text={new Date(w.updatedAt).toLocaleString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3,
                      timeZoneName: 'short',
                    })}
                  >
                    <time className="project-timestamp" dateTime={w.updatedAt} tabIndex={0}>
                      {new Date(w.updatedAt).toLocaleString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
export function ProjectOverview() {
  const {session, state} = useWorkspace();
  const doc = useStore(state.store, (s) => s.document);
  const name = useNameField(
    doc.workspace.name,
    'Projektnamen',
    (value) => session.rename(value),
    report,
  );
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const datasets = Object.values(doc.datasets).filter((dataset) => !dataset.removedAt);
  const analyses = Object.values(doc.analyses).filter((analysis) => !analysis.archivedAt);
  const navigate = useNavigate();
  const analysesHost = useRef<HTMLUListElement>(null);
  const newAnalysis = useRef<HTMLDivElement>(null);
  const create = (kind: 'sql' | 'r') => {
    try {
      const id = session.createAnalysis(kind);
      void navigate({
        to:
          kind === 'sql'
            ? '/projects/$workspaceId/sql/$analysisId'
            : '/projects/$workspaceId/r/$analysisId',
        params: {workspaceId: doc.workspace.id, analysisId: id},
      }).catch(report);
    } catch (error) {
      report(error);
    }
  };
  return (
    <div className="project-details project-overview">
      <h1>{doc.workspace.name}</h1>
      <div className="form-fields">
        <FormField label={<>Projektname</>} error={name.error}>
          <Input {...name.input} disabled={session.readOnly} />
        </FormField>
        <FormField label="Beschreibung" optional>
          <Textarea
            id="workspace-description"
            value={doc.workspace.description ?? ''}
            disabled={session.readOnly}
            maxLength={4000}
            onChange={(e) => {
              try {
                session.describe(e.target.value);
              } catch (error) {
                report(error);
              }
            }}
          />
        </FormField>
      </div>
      <ActionGroup>
        <Button
          variant="primary"
          icon="floppy"
          disabled={session.readOnly || isSaving}
          busy={isSaving}
          busyLabel="Änderungen werden gespeichert …"
          onClick={() => {
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
          }}
        >
          Speichern
        </Button>
      </ActionGroup>
      <section aria-label="Datenübersicht">
        <PanelHeader title="Daten">
          <Link to="/projects/$workspaceId/data" params={{workspaceId: doc.workspace.id}}>
            Daten verwalten
          </Link>
        </PanelHeader>
        {datasets.length === 0 ? (
          <EmptyState>
            Noch keine Daten. Unter „Daten“ kannst du eine Datei oder eine Portalquelle hinzufügen.
          </EmptyState>
        ) : (
          <ul className="project-data-summary">
            {datasets.map((dataset) => {
              const version = doc.datasetVersions[dataset.currentVersionId]!;
              return (
                <li key={dataset.id}>
                  <strong>{dataset.name}</strong>
                  <code>data.{dataset.sqlName}</code>
                  <span>
                    {version.rowCount === undefined
                      ? 'Zeilenanzahl nicht ermittelt'
                      : `${version.rowCount} Zeilen`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <PanelHeader title="Analysen">
          <div ref={newAnalysis}>
            <MenuButton
              label="Neue Analyse"
              disabled={session.readOnly}
              actions={[
                {label: 'Neue SQL-Abfrage', onSelect: () => create('sql')},
                {label: 'Neues R-Skript', onSelect: () => create('r')},
              ]}
            />
          </div>
        </PanelHeader>
        {analyses.length === 0 && (
          <EmptyState>Noch keine Analysen. Erstelle eine SQL-Abfrage oder ein R-Skript.</EmptyState>
        )}
        <ul className="analysis-list" ref={analysesHost}>
          {analyses.map((a) => (
            <li key={a.id}>
              <Link
                to={
                  a.kind === 'sql'
                    ? '/projects/$workspaceId/sql/$analysisId'
                    : '/projects/$workspaceId/r/$analysisId'
                }
                params={{workspaceId: doc.workspace.id, analysisId: a.id}}
              >
                {a.name}
              </Link>
              <StatusBadge>{a.kind.toUpperCase()}</StatusBadge>
              <ActionMenu
                label={`Aktionen für ${a.name}`}
                iconOnly
                disabled={session.readOnly}
                actions={[
                  {
                    label: 'Duplizieren',
                    onSelect: () => {
                      try {
                        session.duplicateAnalysis(a.id);
                      } catch (error) {
                        report(error);
                      }
                    },
                  },
                  {
                    label: 'Archivieren',
                    onSelect: () => {
                      try {
                        const links = Array.from(
                          analysesHost.current?.querySelectorAll('li > a') ?? [],
                        );
                        const index = analyses.findIndex((item) => item.id === a.id);
                        const target = links[index + 1] ?? links[index - 1];
                        session.archiveAnalysis(a.id);
                        requestAnimationFrame(() => {
                          if (target instanceof HTMLElement && target.isConnected) target.focus();
                          else newAnalysis.current?.querySelector('button')?.focus();
                        });
                      } catch (error) {
                        report(error);
                      }
                    },
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      </section>
      <ArchiveActions session={session} />
      <Diagnostics session={session} />
    </div>
  );
}

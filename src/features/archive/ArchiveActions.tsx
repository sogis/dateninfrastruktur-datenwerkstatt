import {MenuButton} from '../../ui/ActionMenu';
import {
  ActionStatus,
  Button,
  Input,
  Select,
  FormField,
  ActionGroup,
  FileInput,
  Notice,
} from '../../ui/Controls';
import {useActionFeedback} from '../../ui/useActionFeedback';
import {useRef, useState, useSyncExternalStore} from 'react';
import {Link, useNavigate} from '@tanstack/react-router';
import {services} from '../../app/services';
import {downloadStream} from '../../app/download';
import {report, router as routerApi} from '../../app/router';
import {Modal} from '../../ui/Modal';
import type {EditingSession} from '../../application/workspaceService';
import type {ArchiveCandidate} from '../../application/workspaceArchive';

export function ArchiveImport() {
  const [candidate, setCandidate] = useState<ArchiveCandidate>(),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const navigate = useNavigate();
  return (
    <section className="archive-import">
      <FormField label="Projektdatei importieren">
        <FileInput
          buttonLabel="Datei auswählen …"
          type="file"
          accept=".dwproj,.zip"
          disabled={busy || !services.workspaces.canCreate}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (pending.current || !file || !services.workspaces.canCreate) return;
            pending.current = true;
            setBusy(true);
            void services.workspaces
              .getArchive()
              .inspect(file, new AbortController().signal)
              .then(setCandidate)
              .catch(report)
              .finally(() => {
                pending.current = false;
                setBusy(false);
              });
          }}
        />
      </FormField>
      {busy && <Notice tone="info">Archiv wird geprüft/verarbeitet …</Notice>}
      {candidate && (
        <Modal
          title="Projektimport bestätigen"
          onClose={() => {
            if (!busy) {
              setCandidate(undefined);
              services.workspaces.getArchive().discard();
            }
          }}
          footer={
            <>
              <Button
                variant="primary"
                disabled={busy}
                busy={busy}
                busyLabel="Projekt wird importiert …"
                onClick={() => {
                  if (pending.current || !services.workspaces.canCreate) return;
                  pending.current = true;
                  setBusy(true);
                  void services.workspaces
                    .importArchive(candidate.id, new AbortController().signal)
                    .then(async (d) => {
                      setCandidate(undefined);
                      await navigate({
                        to: '/projects/$workspaceId',
                        params: {workspaceId: d.workspace.id},
                      });
                    })
                    .catch(report)
                    .finally(() => {
                      pending.current = false;
                      setBusy(false);
                    });
                }}
              >
                Als neues Projekt importieren
              </Button>
            </>
          }
        >
          <p>
            <strong>{candidate.inspection.workspaceName}</strong>
          </p>
          <dl className="dw-meta-list">
            <div>
              <dt>Datensätze</dt>
              <dd>{candidate.inspection.datasets}</dd>
            </div>
            <div>
              <dt>Analysen</dt>
              <dd>{candidate.inspection.analyses}</dd>
            </div>
            <div>
              <dt>Enthaltene Daten</dt>
              <dd>{candidate.inspection.includedBytes} Bytes</dd>
            </div>
          </dl>
          <p>
            {candidate.inspection.containsExecutableCode
              ? 'Enthält SQL-/R-Code. Dieser wird beim Import nicht ausgeführt.'
              : 'Kein ausführbarer Analysecode enthalten.'}{' '}
            Alle internen IDs werden neu vergeben.
          </p>
          {candidate.inspection.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </Modal>
      )}
    </section>
  );
}
export function ArchiveActions({session}: {session: EditingSession}) {
  useSyncExternalStore(session.persistence.subscribe, () => session.persistence.document);
  useSyncExternalStore(session.scheduler.subscribe, session.scheduler.getSnapshot);
  const doc = session.document;
  const [dialog, setDialog] = useState<'export' | 'delete'>(),
    [mode, setMode] = useState<'recipe' | 'with-data'>('with-data'),
    [keep, setKeep] = useState(true),
    [external, setExternal] = useState(false),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [hasOmissions, setHasOmissions] = useState(false);
  const feedback = useActionFeedback();
  const exportButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [busyAction, setBusyAction] = useState('');
  const integrity = session.integrity;
  const navigate = useNavigate();
  const temporary = Object.values(doc.results).filter(
    (r) => r.materialization.kind === 'session',
  ).length;
  const references = Object.values(doc.datasetVersions).filter(
    (v) => v.backing.kind === 'public-parquet',
  ).length;
  const missing =
    Object.values(doc.datasetVersions).filter((v) => v.backing.kind === 'missing').length +
    (integrity?.missing.length ?? 0) +
    (integrity?.corrupt.length ?? 0);
  const act = (action: string, work: (attempt: number) => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusyAction(action);
    setBusy(true);
    const attempt = feedback.begin();
    setHasOmissions(false);
    void Promise.resolve()
      .then(() => work(attempt))
      .catch((error) => {
        if (feedback.isCurrent(attempt)) report(error);
      })
      .finally(() => {
        pending.current = false;
        if (feedback.isCurrent(attempt)) {
          setBusyAction('');
          setBusy(false);
        }
      });
  };
  return (
    <section className="archive-actions">
      <h2>Projektdatei und Speicher</h2>
      <ActionGroup>
        <Button ref={exportButton} disabled={busy} onClick={() => setDialog('export')}>
          Projekt exportieren
        </Button>
        <MenuButton
          label="Projektaktionen"
          variant="tertiary"
          actions={[
            {
              label: 'Projekt duplizieren',
              disabled: busy || !services.workspaces.canCreate,
              busy: busyAction === 'duplicate',
              busyLabel: 'Projekt wird dupliziert …',
              onSelect: () =>
                act('duplicate', async () => {
                  const d = await services.workspaces.duplicate(
                    doc.workspace.id,
                    new AbortController().signal,
                  );
                  await navigate({
                    to: '/projects/$workspaceId',
                    params: {workspaceId: d.workspace.id},
                  });
                }),
            },
            {
              label: 'Projekt löschen',
              tone: 'danger',
              separatorBefore: true,
              disabled: busy || session.readOnly,
              onSelect: () =>
                act('delete-dialog', async () => {
                  if (session.readOnly) return;
                  await session.flush();
                  setRevision(session.document.revision);
                  setDialog('delete');
                }),
            },
          ]}
        />
      </ActionGroup>
      {busy && (
        <p role="status">
          {busyAction === 'duplicate'
            ? 'Projekt wird dupliziert …'
            : 'Projektaktion wird verarbeitet …'}
        </p>
      )}
      {!!missing && (
        <Notice tone="danger">
          Betroffene Daten sind nicht verfügbar. Code und Herkunft bleiben erhalten. Daten über
          „Daten ersetzen“ als neue Version wieder einbinden. Weitere Angaben stehen in der{' '}
          <Link to="/projects/$workspaceId/diagnostics" params={{workspaceId: doc.workspace.id}}>
            Diagnose
          </Link>
          .
        </Notice>
      )}
      {session.integrityError && (
        <Notice tone="danger">
          Dateiinventar konnte nicht geprüft werden: {session.integrityError}{' '}
          <Link to="/projects/$workspaceId/diagnostics" params={{workspaceId: doc.workspace.id}}>
            Diagnose öffnen
          </Link>
          .
        </Notice>
      )}
      {hasOmissions && feedback.message ? (
        <Notice tone="info" onDismiss={feedback.clear} dismissFocusRef={exportButton}>
          {feedback.message}
        </Notice>
      ) : (
        <ActionStatus>{feedback.message}</ActionStatus>
      )}
      {dialog === 'export' && (
        <Modal
          title="Projekt exportieren"
          onClose={() => {
            if (!busy) setDialog(undefined);
          }}
          footer={
            <>
              <Button
                variant="primary"
                disabled={busy}
                busy={busyAction === 'export'}
                busyLabel="Archiv wird erstellt …"
                onClick={() =>
                  act('export', async (attempt) => {
                    const result = await session.exportArchive(
                      mode,
                      {keepTemporary: keep && !session.readOnly, includeExternal: external},
                      new AbortController().signal,
                    );
                    await downloadStream(
                      result.blob.stream(),
                      'datenwerkstatt.dwproj',
                      'application/zip',
                    );
                    if (!feedback.isCurrent(attempt)) return;
                    const omitted = result.manifest.omissions.length > 0;
                    setHasOmissions(omitted);
                    feedback.show(
                      attempt,
                      omitted
                        ? `Archiv exportiert mit ${result.manifest.omissions.length} ausdrücklich dokumentierten Auslassungen.`
                        : 'Archiv mit sämtlichen gespeicherten Datenständen exportiert.',
                      omitted ? 'persistent' : 'brief',
                    );
                    setDialog(undefined);
                  })
                }
              >
                Archiv herunterladen
              </Button>
            </>
          }
        >
          <FormField label={<>Archivmodus</>}>
            <Select
              required
              value={mode}
              disabled={busy}
              onChange={(e) => setMode(e.target.value as 'recipe' | 'with-data')}
            >
              <option value="with-data">Mit Daten</option>
              <option value="recipe">Rezept ohne lokale Bytes</option>
            </Select>
          </FormField>
          <dl className="dw-meta-list">
            <div>
              <dt>Datensätze</dt>
              <dd>{Object.keys(doc.datasets).length}</dd>
            </div>
            <div>
              <dt>Resultate</dt>
              <dd>{Object.keys(doc.results).length}</dd>
            </div>
            <div>
              <dt>Bekannte lokale Daten</dt>
              <dd>{Object.values(doc.artifacts).reduce((n, a) => n + a.bytes, 0)} Bytes</dd>
            </div>
            <div>
              <dt>Temporäre Resultate</dt>
              <dd>{temporary}</dd>
            </div>
            <div>
              <dt>Externe Datenstände</dt>
              <dd>{references}</dd>
            </div>
            <div>
              <dt>Fehlende oder beschädigte Datenstände</dt>
              <dd>{missing}</dd>
            </div>
          </dl>
          <p>
            Auslassungen werden im Archiv dokumentiert; externe oder fehlende Quellen sind nicht
            offline verfügbar.
          </p>
          {mode === 'with-data' && (
            <>
              <FormField label={<>Temporäre Resultate vor Export aufbewahren</>}>
                <Input
                  type="checkbox"
                  checked={keep && !session.readOnly}
                  disabled={busy || session.readOnly}
                  onChange={(e) => setKeep(e.target.checked)}
                />
              </FormField>
              <FormField label={<>Externe Quellen ebenfalls sichern</>}>
                <Input
                  type="checkbox"
                  checked={external}
                  disabled={busy}
                  onChange={(e) => setExternal(e.target.checked)}
                />
              </FormField>
            </>
          )}
        </Modal>
      )}
      {dialog === 'delete' && (
        <Modal
          title="Projekt endgültig löschen?"
          onClose={() => {
            if (!busy) setDialog(undefined);
          }}
          footer={
            <>
              <Button
                variant="primary"
                tone="danger"
                disabled={busy}
                busy={busyAction === 'delete'}
                busyLabel="Projekt wird gelöscht …"
                onClick={() =>
                  act('delete', async () => {
                    if (session.readOnly) return;
                    const failures = await services.workspaces.deleteWorkspace(
                      doc.workspace.id,
                      revision,
                    );
                    setDialog(undefined);
                    if (failures.length)
                      report(
                        new Error(
                          `Projekt gelöscht; ${failures.length} Dateireste sind in den Einstellungen unter „Browser-Speicher“ bereinigbar.`,
                        ),
                      );
                    await routerApi.invalidate();
                    await navigate({to: '/projects'});
                  })
                }
              >
                Endgültig löschen
              </Button>
            </>
          }
        >
          <p>
            {doc.workspace.name}: {Object.keys(doc.datasets).length} Datensätze,{' '}
            {Object.keys(doc.analyses).length} Analysen und{' '}
            {Object.values(doc.results).filter((r) => r.retention === 'kept').length} gesicherte
            Resultate werden gelöscht. Laufende Jobs werden beendet. Ein heruntergeladenes Archiv
            bleibt bestehen.
          </p>
        </Modal>
      )}
    </section>
  );
}

import {Button, Input, FormField, ActionStatus, Notice} from '../../ui/Controls';
import {useActionFeedback} from '../../ui/useActionFeedback';
import {useRef, useState, useSyncExternalStore} from 'react';
import {Link} from '@tanstack/react-router';
import {timings} from '../../application/diagnostics';
import type {ArtifactReferenceCheck} from '../../application/ports';
import {services} from '../../app/services';
import {downloadStream} from '../../app/download';
import {report, useWorkspace} from '../../app/router';

function IntegrityStatus({
  integrity,
  hashesChecked,
}: {
  integrity: ArtifactReferenceCheck;
  hashesChecked: boolean;
}) {
  const problems =
    integrity.missing.length + integrity.corrupt.length + integrity.orphanPaths.length;
  const details = (
    <>
      <p>
        {problems
          ? 'Bei der Dateiprüfung wurden Auffälligkeiten festgestellt.'
          : 'Bei der Inventarprüfung wurden keine fehlenden oder verwaisten Dateien festgestellt.'}
      </p>
      {problems > 0 && (
        <dl className="dw-meta-list">
          <div>
            <dt>Fehlende Dateien</dt>
            <dd>{integrity.missing.length}</dd>
          </div>
          <div>
            <dt>Beschädigte Dateien</dt>
            <dd>
              {hashesChecked || integrity.corrupt.length > 0
                ? integrity.corrupt.length
                : 'noch nicht geprüft'}
            </dd>
          </div>
          <div>
            <dt>Verwaiste Dateien</dt>
            <dd>{integrity.orphanPaths.length}</dd>
          </div>
        </dl>
      )}
      <p>
        {hashesChecked
          ? integrity.corrupt.length > 0
            ? 'Dateilängen und SHA-256 wurden geprüft.'
            : 'Dateilängen und SHA-256 wurden geprüft. Es wurden keine beschädigten Dateien festgestellt.'
          : 'Dateilängen und SHA-256 wurden noch nicht geprüft. Die Prüfung erfolgt vor der Verwendung oder über „Integrität prüfen“.'}
      </p>
    </>
  );
  return problems ? <Notice tone="warning">{details}</Notice> : <div>{details}</div>;
}
export function Diagnostics() {
  const {session} = useWorkspace();
  const doc = useSyncExternalStore(session.persistence.subscribe, () => session.document);
  const operation = useSyncExternalStore(
    session.scheduler.subscribe,
    session.scheduler.getSnapshot,
  );
  const [code, setCode] = useState(false);
  const [checking, setChecking] = useState(false);
  const feedback = useActionFeedback();
  const pending = useRef(false);
  const check = () => {
    if (pending.current || session.scheduler.getSnapshot()) return;
    pending.current = true;
    setChecking(true);
    const attempt = feedback.begin();
    void session
      .inspectIntegrity(new AbortController().signal, true)
      .then((result) => {
        feedback.show(
          attempt,
          result
            ? 'Die Dateiprüfung ist abgeschlossen.'
            : 'Die Dateiprüfung ist in dieser Sitzung nicht verfügbar.',
          result ? 'brief' : 'persistent',
        );
      })
      .catch((error) => {
        if (feedback.isCurrent(attempt)) report(error);
      })
      .finally(() => {
        pending.current = false;
        if (feedback.isCurrent(attempt)) setChecking(false);
      });
  };
  return (
    <div className="project-details diagnostics-page">
      <header>
        <h1>Diagnose</h1>
        <p className="project-context">
          Projekt:{' '}
          <Link to="/projects/$workspaceId" params={{workspaceId: doc.workspace.id}}>
            {doc.workspace.name}
          </Link>
        </p>
      </header>
      <section aria-labelledby="diagnostics-files-heading">
        <h2 id="diagnostics-files-heading">Dateiprüfung</h2>
        {session.integrityError && (
          <Notice tone="danger">
            <p>Die letzte Dateiprüfung ist fehlgeschlagen: {session.integrityError}</p>
            {session.integrity && <p>Die angezeigten Werte stammen aus der vorherigen Prüfung.</p>}
          </Notice>
        )}
        {session.integrity ? (
          <IntegrityStatus integrity={session.integrity} hashesChecked={session.hashesChecked} />
        ) : (
          !session.integrityError && <p>Das Dateiinventar wurde noch nicht geprüft.</p>
        )}
        <Button
          disabled={!!operation || checking}
          busy={checking}
          busyLabel="Integrität wird geprüft …"
          onClick={check}
        >
          Integrität prüfen
        </Button>
        <ActionStatus className="diagnostics-check-status secondary-text">
          {feedback.message}
        </ActionStatus>
      </section>
      <section aria-labelledby="diagnostics-report-heading">
        <h2 id="diagnostics-report-heading">Diagnosebericht</h2>
        <p>
          Für technische Abklärungen kannst du einen lokalen Bericht herunterladen. Er enthält IDs,
          Laufstatus, protokollierte Runtimeversionen und die letzten 200 Zeitmessungen.
        </p>
        <p>
          Tabellenwerte, Dateien, Quellen-URLs, Parametersätze und Fehlermeldungstexte werden nicht
          aufgenommen. Analysecode wird nur auf ausdrückliche Auswahl ergänzt.
        </p>
        <p className="secondary-text" role="status">
          {operation ? `Aktueller Vorgang: ${operation}.` : 'Die Sitzung ist bereit.'}
        </p>
        <FormField label="Analysecode in den Bericht aufnehmen">
          <Input type="checkbox" checked={code} onChange={(e) => setCode(e.target.checked)} />
        </FormField>
        <Button
          onClick={() => {
            const d = session.document;
            const data = {
              formatVersion: 1,
              createdAt: new Date().toISOString(),
              buildId: services.config?.buildId,
              workspaceId: d.workspace.id,
              sessionId: session.sessionId,
              revision: d.revision,
              mode: session.mode,
              readOnly: session.readOnly,
              counts: {
                datasets: Object.keys(d.datasets).length,
                runs: Object.keys(d.runs).length,
                results: Object.keys(d.results).length,
              },
              runs: Object.values(d.runs).map((r) => ({
                id: r.id,
                status: r.status,
                durationMs: r.durationMs,
                errorCode: r.error?.code,
                runtime: r.snapshot.runtime,
              })),
              timings: timings(),
              ...(code
                ? {
                    analyses: Object.values(d.analyses).map((a) => ({
                      id: a.id,
                      language: a.kind,
                      code: a.code,
                    })),
                  }
                : {}),
            };
            void downloadStream(
              new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}).stream(),
              'datenwerkstatt-diagnose.json',
              'application/json',
            ).catch(report);
          }}
        >
          Diagnosebericht herunterladen
        </Button>
      </section>
      <details className="diagnostics-technical">
        <summary>Technische Details</summary>
        <dl className="diagnostics-metadata">
          <dt>Sitzungs-ID</dt>
          <dd>
            <code>{session.sessionId}</code>
          </dd>
          <dt>Build</dt>
          <dd>
            <code>{services.config?.buildId ?? 'nicht verfügbar'}</code>
          </dd>
          <dt>Speichermodus</dt>
          <dd>{session.mode === 'temporary' ? 'Nur diese Sitzung' : 'Lokal im Browser'}</dd>
          <dt>Schreibzugriff</dt>
          <dd>{session.readOnly ? 'Nur lesend' : 'Schreibend'}</dd>
          <dt>Projektrevision</dt>
          <dd>{doc.revision}</dd>
          <dt>Protokollierte Läufe</dt>
          <dd>{Object.keys(doc.runs).length}</dd>
          <dt>Resultate</dt>
          <dd>{Object.keys(doc.results).length}</dd>
        </dl>
      </details>
    </div>
  );
}

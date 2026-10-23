import {MenuButton} from '../../ui/ActionMenu';
import {Button, ActionGroup, ActionStatus, Notice} from '../../ui/Controls';
import {useActionFeedback} from '../../ui/useActionFeedback';
import {useEffect, useRef, useState} from 'react';
import {Link} from '@tanstack/react-router';
import {services} from '../../app/services';
import {report} from '../../app/router';
import {Modal} from '../../ui/Modal';
export function StorageSettings() {
  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof services.storageEstimate>>>(),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<{removed: number; failures: string[]}>();
  const cleaning = useRef(false);
  const manageFocus = useRef<HTMLButtonElement>(null);
  const feedback = useActionFeedback();
  const refresh = () => void services.storageEstimate().then(setEstimate).catch(report);
  useEffect(refresh, []);
  const bytes = (value: number | undefined) =>
    value === undefined
      ? 'nicht verfügbar'
      : `${new Intl.NumberFormat('de-CH', {maximumFractionDigits: 1}).format(value / 1048576)} MiB`;
  return (
    <section aria-label="Browser-Speicher">
      <h2>Browser-Speicher</h2>
      <p>
        {services.mode === 'temporary'
          ? 'Die Daten sind nur in dieser Sitzung verfügbar und gehen beim Neuladen verloren.'
          : 'Die Daten werden lokal in diesem Browser gespeichert und nicht automatisch gesichert.'}
      </p>
      <dl className="dw-meta-list">
        <div>
          <dt>Geschätzter Verbrauch</dt>
          <dd>{bytes(estimate?.usage)}</dd>
        </div>
        <div>
          <dt>Browserbudget</dt>
          <dd>{bytes(estimate?.quota)}</dd>
        </div>
      </dl>
      <p>Die Schätzung reserviert keinen Speicher.</p>
      <div
        className="storage-settings-actions"
        ref={(node) => {
          manageFocus.current =
            node?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]') ?? null;
        }}
      >
        <ActionGroup>
          <Button onClick={refresh}>Speicherstatus aktualisieren</Button>
          <MenuButton
            label="Speicher verwalten"
            variant="tertiary"
            actions={[
              {label: 'Projekte verwalten und gezielt löschen', link: <Link to="/projects" />},
              {
                label: 'Nicht referenzierte Projektreste bereinigen',
                disabled: busy,
                tone: 'danger',
                separatorBefore: true,
                onSelect: () => setConfirm(true),
              },
            ]}
          />
        </ActionGroup>
      </div>
      {feedback.message &&
        (receipt ? (
          <Notice
            tone="warning"
            dismissFocusRef={manageFocus}
            onDismiss={() => {
              feedback.clear();
              setReceipt(undefined);
            }}
          >
            <p>{feedback.message}</p>
            <p>{receipt.failures.length} Dateien konnten nicht bereinigt werden.</p>
            <ul>
              {receipt.failures.map((failure, index) => (
                <li key={index}>{failure}</li>
              ))}
            </ul>
          </Notice>
        ) : (
          <ActionStatus>{feedback.message}</ActionStatus>
        ))}
      {confirm && (
        <Modal
          title="Projektreste bereinigen?"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
          footer={
            <>
              <Button
                variant="primary"
                tone="danger"
                disabled={busy}
                busy={busy}
                busyLabel="Projektreste werden bereinigt …"
                onClick={() => {
                  if (cleaning.current) return;
                  cleaning.current = true;
                  const attempt = feedback.begin();
                  setReceipt(undefined);
                  setBusy(true);
                  void services.workspaces
                    .cleanAbandoned(new AbortController().signal)
                    .then((r) => {
                      if (!feedback.isCurrent(attempt)) return;
                      if (r.failures.length > 0)
                        setReceipt({removed: r.removed.length, failures: r.failures});
                      feedback.show(
                        attempt,
                        r.removed.length === 0
                          ? 'Es wurden keine Dateien bereinigt.'
                          : `${r.removed.length} Dateien wurden bereinigt.`,
                        r.failures.length > 0 ? 'persistent' : 'brief',
                      );
                      setConfirm(false);
                      refresh();
                    })
                    .catch((error) => {
                      if (feedback.isCurrent(attempt)) report(error);
                    })
                    .finally(() => {
                      cleaning.current = false;
                      if (feedback.isCurrent(attempt)) setBusy(false);
                    });
                }}
              >
                Bereinigung bestätigen
              </Button>
            </>
          }
        >
          <p>
            Entfernt ausschliesslich eigene Dateien abgebrochener oder bereits gelöschter Projekte
            ohne Projektmetadaten. Gespeicherte Projekte, benötigte Resultate und fremde Dateien
            bleiben erhalten. Aktive Writer werden ausgelassen.
          </p>
        </Modal>
      )}
    </section>
  );
}

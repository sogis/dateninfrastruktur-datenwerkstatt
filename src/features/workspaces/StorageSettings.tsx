import {MenuButton} from '../../ui/ActionMenu';
import {Button, ActionGroup, Notice} from '../../ui/Controls';
import {useEffect, useRef, useState} from 'react';
import {Link} from '@tanstack/react-router';
import {services} from '../../app/services';
import {report} from '../../app/router';
import {Modal} from '../../ui/Modal';
export function StorageSettings() {
  const [estimate, setEstimate] = useState<Awaited<ReturnType<typeof services.storageEstimate>>>(),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState('');
  const cleaning = useRef(false);
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
          ? 'Nur diese Sitzung · kein dauerhafter Speicher'
          : 'Lokal im Browser · Browserdaten sind kein Backup.'}
      </p>
      <p>
        Geschätzter Verbrauch: {bytes(estimate?.usage)} · Browserbudget: {bytes(estimate?.quota)}.
        Die Schätzung reserviert keinen Speicher.
      </p>
      <div className="storage-settings-actions">
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
      {receipt && <Notice tone="info">{receipt}</Notice>}
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
                  setBusy(true);
                  void services.workspaces
                    .cleanAbandoned(new AbortController().signal)
                    .then((r) => {
                      setReceipt(`${r.removed.length} Dateien bereinigt. ${r.failures.join('; ')}`);
                      setConfirm(false);
                      refresh();
                    })
                    .catch(report)
                    .finally(() => {
                      cleaning.current = false;
                      setBusy(false);
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

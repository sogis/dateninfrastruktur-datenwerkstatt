import {useRef, useState} from 'react';
import type {SqlAnalysis, SqlAnalysisVersion} from '../../domain/model';
import type {EditingSession} from '../../application/workspaceService';
import {failureMessage} from '../../application/errors';
import {Button, ActionGroup, Notice, EmptyState} from '../../ui/Controls';
import {Modal} from '../../ui/Modal';
import {runTimeText} from '../results/RunDetails';

export function SqlVersions({
  analysis,
  session,
  onClose,
}: {
  analysis: SqlAnalysis;
  session: EditingSession;
  onClose(): void;
}) {
  const [selected, setSelected] = useState<SqlAnalysisVersion>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const loading = useRef(false);
  const versions = Object.values(session.document.sqlVersions)
    .filter((version) => version.analysisId === analysis.id)
    .reverse();
  const load = (version: SqlAnalysisVersion) => {
    if (loading.current || session.readOnly) return;
    loading.current = true;
    setBusy(true);
    setError('');
    void session
      .restoreSqlVersion(version.id)
      .then(onClose)
      .catch((failure: unknown) => {
        setError(failureMessage(failure));
      })
      .finally(() => {
        loading.current = false;
        setBusy(false);
      });
  };
  return (
    <Modal
      title="SQL-Versionen"
      onClose={() => {
        if (!loading.current) onClose();
      }}
      showClose={false}
      footer={
        <Button disabled={busy} onClick={onClose}>
          Schliessen
        </Button>
      }
    >
      {versions.length === 0 && <EmptyState>Noch keine Version gespeichert.</EmptyState>}
      {selected ? (
        <>
          <p>
            Version „{selected.name}“ ersetzt den aktuellen Arbeitsstand einschliesslich der
            Parameter. Der bisherige Entwurf wird dabei nicht als Version gespeichert. Es wird keine
            Abfrage ausgeführt.
          </p>
          <ActionGroup>
            <Button
              disabled={busy}
              onClick={() => {
                setSelected(undefined);
                setError('');
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              busy={busy}
              busyLabel="Version wird geladen …"
              disabled={busy || session.readOnly}
              onClick={() => load(selected)}
            >
              Arbeitsstand ersetzen
            </Button>
          </ActionGroup>
        </>
      ) : (
        <ul className="sql-version-list">
          {versions.map((version) => (
            <li key={version.id}>
              <div>
                <strong>{version.name}</strong>
                <br />
                <time dateTime={version.createdAt}>{runTimeText(version.createdAt)}</time>
              </div>
              <Button
                disabled={session.readOnly || busy}
                aria-label={`Version ${version.name} in Editor laden`}
                onClick={() => {
                  const current = session.document.analyses[analysis.id]!;
                  if (
                    current.code !== version.code ||
                    JSON.stringify(current.parameters) !== JSON.stringify(version.parameters)
                  )
                    setSelected(version);
                  else load(version);
                }}
              >
                In Editor laden
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </Modal>
  );
}

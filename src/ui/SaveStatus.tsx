import {useState} from 'react';
import type {SaveState} from '../application/persistenceCoordinator';
import type {EditingSession} from '../application/workspaceService';
import {failureMessage} from '../application/errors';
import {Button, Tooltip} from './Controls';
import {Modal} from './Modal';

export function SaveStatus({
  session,
  state,
  error,
  onError,
}: {
  session: EditingSession;
  state: SaveState;
  error: unknown;
  onError(error: unknown): void;
}) {
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const temporary = session.mode === 'temporary';
  const failed = state === 'error' || error !== undefined;
  const description = failed
    ? 'Speichern fehlgeschlagen'
    : state === 'saving'
      ? 'Änderungen werden gespeichert …'
      : state === 'dirty'
        ? 'Änderungen noch nicht gespeichert'
        : temporary
          ? 'Nur diese Sitzung: Änderungen gehen beim Neuladen verloren'
          : session.readOnly
            ? 'Gespeicherter Projektstand · nur lesbar'
            : 'Lokal gespeichert';
  const tone = !temporary && state === 'saved' && !failed ? 'success' : 'warning';
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (session.persistence.generation === session.persistence.savedGeneration)
        session.persistence.acknowledgeUnpublishedFailure();
      else await session.flush();
    } catch (failure) {
      if (failure !== session.persistence.error) onError(failure);
    } finally {
      setRetrying(false);
    }
  };
  return (
    <>
      <Tooltip text={description}>
        <Button
          variant="tertiary"
          className="workspace-save-indicator"
          data-save-state={state}
          data-tone={tone}
          aria-label={`Speicherstatus: ${description}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <span className="workspace-save-dot" aria-hidden="true" />
        </Button>
      </Tooltip>
      <span role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {description}
      </span>
      {open && (
        <Modal
          title="Speicherstatus"
          onClose={() => setOpen(false)}
          footer={
            failed && !session.readOnly ? (
              <Button
                busy={retrying}
                busyLabel="Speichern wird erneut versucht …"
                onClick={() => void retry()}
              >
                {session.persistence.generation === session.persistence.savedGeneration
                  ? 'Vorherigen Projektstand beibehalten'
                  : 'Speichern erneut versuchen'}
              </Button>
            ) : undefined
          }
        >
          <p>{description}</p>
          {failed && (
            <p role="alert">
              {error === undefined
                ? 'Die Änderungen konnten nicht gespeichert werden. Bitte versuche es erneut.'
                : failureMessage(error)}
            </p>
          )}
          {!temporary && (
            <p>
              Der Status betrifft die Projektmetadaten und aufbewahrten Ergebnisse in diesem
              Browser. Temporäre Ergebnisse sind nicht dauerhaft gesichert.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

import {useEffect, useRef, useState, type RefObject} from 'react';
import type {AnalysisId} from '../../domain/model';
import type {EditingSession} from '../../application/workspaceService';
import {checkSqlFile, parseSqlFile} from '../../application/sqlDocument';
import {failureMessage} from '../../application/errors';
import {Button} from '../../ui/Controls';
import {Modal} from '../../ui/Modal';

export function SqlDocuments({
  session,
  currentId,
  onOpen,
  onNew,
  onClose,
}: {
  session: EditingSession;
  currentId: AnalysisId;
  onOpen(id: AnalysisId): void;
  onNew(): void;
  onClose(): void;
}) {
  const documents = Object.values(session.document.analyses).filter(
    (item) => item.kind === 'sql' && !item.archivedAt,
  );
  return (
    <Modal
      title="SQL-Analyse öffnen"
      onClose={onClose}
      footer={
        <Button icon="plus-lg" disabled={session.readOnly} onClick={onNew}>
          Neu
        </Button>
      }
    >
      <ul className="sql-document-list">
        {documents.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            {item.id === currentId ? (
              <span className="secondary-text">Geöffnet</span>
            ) : (
              <Button aria-label={`Analyse ${item.name} öffnen`} onClick={() => onOpen(item.id)}>
                Öffnen
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!documents.some((item) => item.id !== currentId) && (
        <p>Keine weiteren SQL-Analysen vorhanden.</p>
      )}
    </Modal>
  );
}

/** The keyed input owns the file read; leaving this analysis discards late replies. */
export function SqlFileInput({
  session,
  inputRef,
  onOpen,
}: {
  session: EditingSession;
  inputRef: RefObject<HTMLInputElement | null>;
  onOpen(id: AnalysisId): void;
}) {
  const live = useRef(false);
  const pending = useRef(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const open = async (file: File) => {
    if (pending.current || session.readOnly) return;
    pending.current = true;
    setReading(true);
    setError('');
    try {
      checkSqlFile(file.name, file.size);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!live.current) return;
      const text = parseSqlFile(file.name, bytes);
      const id = session.createAnalysis('sql', text);
      onOpen(id);
    } catch (failure) {
      if (live.current) setError(failureMessage(failure));
    } finally {
      pending.current = false;
      if (live.current) setReading(false);
    }
  };
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".sql"
        aria-label="SQL-Datei öffnen"
        className="visually-hidden"
        tabIndex={-1}
        disabled={session.readOnly || reading}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void open(file);
        }}
      />
      {error && (
        <Modal title="SQL-Datei konnte nicht geöffnet werden" onClose={() => setError('')}>
          <p role="alert">{error}</p>
        </Modal>
      )}
    </>
  );
}

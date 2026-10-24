import {useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Link, useRouter} from '@tanstack/react-router';
import type {EditingSession} from '../../application/workspaceService';
import {failureMessage} from '../../application/errors';
import {services} from '../../app/services';
import {ActionGroup, Button, Notice} from '../../ui/Controls';
import {useActionFeedback} from '../../ui/useActionFeedback';

interface WriteAccessAttempt {
  feedbackAttempt: number;
  controller: AbortController;
  sourceSessionId: string;
  replacementSessionId: string | undefined;
  preserveFocus: boolean;
  stopTrackingFocus(): void;
}

/** Project-scoped feedback survives a successful replacement of its editing session. */
export function WorkspaceWriteAccess({session}: {session: EditingSession}) {
  const router = useRouter();
  const access = useSyncExternalStore(session.subscribeWriteAccess, session.getWriteAccessSnapshot);
  const feedback = useActionFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusFocused, setStatusFocused] = useState(false);
  const currentSession = useRef(session);
  currentSession.current = session;
  const pending = useRef<WriteAccessAttempt | undefined>(undefined);
  const retryRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const nextFocus = useRef<'retry' | 'status' | undefined>(undefined);
  const hintId = useId();
  const statusId = useId();
  const workspaceId = session.document.workspace.id;
  const webLocksUnavailable = access.reason === 'locks-unavailable';

  useEffect(
    () => () => {
      pending.current?.controller.abort();
      pending.current?.stopTrackingFocus();
      pending.current = undefined;
    },
    [],
  );

  useEffect(() => {
    const request = pending.current;
    if (
      request &&
      session.sessionId !== request.sourceSessionId &&
      session.sessionId !== request.replacementSessionId
    ) {
      request.controller.abort();
      request.stopTrackingFocus();
      pending.current = undefined;
      nextFocus.current = undefined;
      feedback.clear();
      setError('');
      setBusy(false);
    }
  }, [session, feedback.clear]);

  useLayoutEffect(() => {
    const target = nextFocus.current === 'retry' ? retryRef.current : statusRef.current;
    if (!nextFocus.current || !target || target.matches(':disabled') || target.hidden) return;
    nextFocus.current = undefined;
    target.focus({preventScroll: true});
  }, [busy, error, feedback.message, session]);

  const reacquire = (button: HTMLButtonElement) => {
    if (pending.current || !session.readOnly || webLocksUnavailable) return;
    const request: WriteAccessAttempt = {
      feedbackAttempt: feedback.begin(),
      controller: new AbortController(),
      sourceSessionId: session.sessionId,
      replacementSessionId: undefined,
      preserveFocus: button.ownerDocument.activeElement === button,
      stopTrackingFocus: () => {},
    };
    pending.current = request;
    nextFocus.current = undefined;
    setBusy(true);
    setError('');
    feedback.show(request.feedbackAttempt, 'Schreibrecht wird geprüft …');

    const doc = button.ownerDocument;
    const focusChanged = (event: FocusEvent) => {
      // A fresh session remounts Monaco, whose own navigation focus is not a user move.
      if (
        request.replacementSessionId &&
        event.target instanceof Element &&
        event.target.closest('.code-editor')
      )
        return;
      if (event.target !== button && event.target !== doc.body) request.preserveFocus = false;
    };
    const pointerMoved = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !button.contains(event.target))
        request.preserveFocus = false;
    };
    const keyboardMoved = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Escape') request.preserveFocus = false;
    };
    doc.addEventListener('focusin', focusChanged, true);
    doc.addEventListener('pointerdown', pointerMoved, true);
    doc.addEventListener('keydown', keyboardMoved, true);
    request.stopTrackingFocus = () => {
      doc.removeEventListener('focusin', focusChanged, true);
      doc.removeEventListener('pointerdown', pointerMoved, true);
      doc.removeEventListener('keydown', keyboardMoved, true);
    };
    const isCurrent = () => {
      const activeSession = currentSession.current.sessionId;
      return (
        pending.current === request &&
        feedback.isCurrent(request.feedbackAttempt) &&
        !request.controller.signal.aborted &&
        (activeSession === request.sourceSessionId ||
          activeSession === request.replacementSessionId) &&
        router.state.matches.some(
          (match) => 'workspaceId' in match.params && match.params.workspaceId === workspaceId,
        )
      );
    };

    void (async () => {
      const result = await services.workspaces.reacquire(
        workspaceId,
        request.sourceSessionId,
        request.controller.signal,
      );
      if (!isCurrent()) return;
      if (result.outcome === 'cancelled') {
        feedback.clear();
        return;
      }
      if (result.outcome === 'still-held') {
        feedback.show(request.feedbackAttempt, 'Das Schreibrecht ist weiterhin belegt.');
        if (request.preserveFocus) nextFocus.current = 'retry';
        return;
      }
      if (result.outcome === 'unavailable') {
        feedback.show(request.feedbackAttempt, 'Die nötige Tab-Sperre ist nicht verfügbar.');
        if (request.preserveFocus) nextFocus.current = 'status';
        return;
      }
      request.replacementSessionId = result.session.sessionId;
      await router.invalidate();
      if (!isCurrent()) return;
      feedback.show(
        request.feedbackAttempt,
        'Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.',
        'brief',
      );
      if (request.preserveFocus) nextFocus.current = 'status';
    })()
      .catch((failure: unknown) => {
        if (!isCurrent()) return;
        feedback.show(request.feedbackAttempt, '');
        setError(failureMessage(failure));
        if (request.preserveFocus) nextFocus.current = 'retry';
      })
      .finally(() => {
        request.stopTrackingFocus();
        if (pending.current !== request) return;
        pending.current = undefined;
        setBusy(false);
      });
  };

  if (!session.readOnly && !feedback.message && !error && !statusFocused) return null;

  return (
    <div className="workspace-write-access">
      {session.readOnly && (
        <Notice role="region" aria-label="Schreibzugriff">
          <p>
            {webLocksUnavailable
              ? 'Das Projekt ist hier nur lesbar. Dieser Browser stellt die nötige Tab-Sperre (Web Locks) nicht bereit.'
              : 'Das Projekt ist hier nur lesbar. Das Schreibrecht ist bereits belegt.'}
          </p>
          <p id={hintId}>
            {webLocksUnavailable
              ? 'Du kannst gespeicherte Inhalte ansehen und exportieren. Öffne das Projekt zum Bearbeiten in einem Browser mit Web-Locks-Unterstützung.'
              : 'Schliesse weitere Tabs oder Fenster dieses Projekts und fordere hier das Schreibrecht erneut an.'}
          </p>
          <ActionGroup>
            {!webLocksUnavailable && (
              <Button
                ref={retryRef}
                busy={busy}
                busyLabel="Schreibrecht wird geprüft …"
                aria-describedby={hintId}
                aria-controls={statusId}
                onClick={(event) => reacquire(event.currentTarget)}
              >
                Schreibrecht erneut anfordern
              </Button>
            )}
            <Link
              to="/projects/$workspaceId/diagnostics"
              params={{workspaceId}}
              className="workspace-write-access-diagnostics"
            >
              Diagnose
            </Link>
          </ActionGroup>
        </Notice>
      )}
      <p
        ref={statusRef}
        id={statusId}
        role="status"
        aria-atomic="true"
        tabIndex={-1}
        className="dw-action-status workspace-write-access-status"
        onFocus={() => setStatusFocused(true)}
        onBlur={() => setStatusFocused(false)}
      >
        {feedback.message}
      </p>
      {error && (
        <Notice tone="danger">
          <p>Das Schreibrecht konnte nicht geprüft werden. Bitte versuche es erneut.</p>
          <details>
            <summary>Technische Details</summary>
            <pre>{error}</pre>
          </details>
        </Notice>
      )}
    </div>
  );
}

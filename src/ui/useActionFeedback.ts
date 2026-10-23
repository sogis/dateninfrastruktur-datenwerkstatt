import {useCallback, useEffect, useRef, useState} from 'react';

/** Local action feedback: only the latest mounted attempt may publish or clear a message. */
export function useActionFeedback() {
  const [message, setMessage] = useState('');
  const generation = useRef(0);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelTimer = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const isCurrent = useCallback(
    (attempt: number) => mounted.current && generation.current === attempt,
    [],
  );
  const begin = useCallback(() => {
    const attempt = ++generation.current;
    cancelTimer();
    if (mounted.current) setMessage('');
    return attempt;
  }, [cancelTimer]);
  const clear = useCallback(() => {
    begin();
  }, [begin]);
  const show = useCallback(
    (attempt: number, text: string, lifetime: 'brief' | 'persistent' = 'persistent') => {
      if (!isCurrent(attempt)) return;
      cancelTimer();
      setMessage(text);
      if (lifetime === 'brief') {
        timer.current = setTimeout(() => {
          if (isCurrent(attempt)) setMessage('');
          timer.current = undefined;
        }, 3000);
      }
    },
    [cancelTimer, isCurrent],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      cancelTimer();
    };
  }, [cancelTimer]);
  return {message, begin, show, clear, isCurrent};
}

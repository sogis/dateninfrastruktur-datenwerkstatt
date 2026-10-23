// @vitest-environment jsdom
import {createElement, StrictMode} from 'react';
import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useActionFeedback} from '../../src/ui/useActionFeedback';

describe('Action feedback lifetime and attempt ownership', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps a brief confirmation for 2999 ms and clears it at 3000 ms', () => {
    const {result} = renderHook(useActionFeedback);
    expect(result.current.message).toBe('');
    act(() => result.current.show(result.current.begin(), 'Gespeichert', 'brief'));
    expect(result.current.message).toBe('Gespeichert');
    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.message).toBe('Gespeichert');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBe('');
  });

  it('restarts the full lifetime for repeated identical successful actions', () => {
    const {result} = renderHook(useActionFeedback);
    act(() => result.current.show(result.current.begin(), 'Gespeichert', 'brief'));
    act(() => vi.advanceTimersByTime(2500));
    act(() => result.current.show(result.current.begin(), 'Gespeichert', 'brief'));
    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.message).toBe('Gespeichert');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBe('');
  });

  it('clears old feedback at the next attempt and ignores its late response and timer', () => {
    const {result} = renderHook(useActionFeedback);
    let previous = 0;
    let current = 0;
    act(() => {
      previous = result.current.begin();
      result.current.show(previous, 'Gespeichert', 'brief');
    });
    act(() => vi.advanceTimersByTime(1000));
    act(() => {
      current = result.current.begin();
    });
    expect(result.current.message).toBe('');
    act(() => result.current.show(current, 'Dateireste konnten nicht entfernt werden.'));
    act(() => result.current.show(previous, 'Verspätete alte Antwort', 'brief'));
    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.message).toBe('Dateireste konnten nicht entfernt werden.');
  });

  it('clears the old brief timer when a persistent message replaces it in the same attempt', () => {
    const {result} = renderHook(useActionFeedback);
    let attempt = 0;
    act(() => {
      attempt = result.current.begin();
      result.current.show(attempt, 'Gespeichert', 'brief');
    });
    act(() => vi.advanceTimersByTime(2999));
    act(() => result.current.show(attempt, 'Archiv enthält Auslassungen.'));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.message).toBe('Archiv enthält Auslassungen.');
  });

  it('dismisses feedback and prevents a late response from reviving the dismissed attempt', () => {
    const {result} = renderHook(useActionFeedback);
    let dismissed = 0;
    act(() => {
      dismissed = result.current.begin();
      result.current.show(dismissed, 'Hinweis');
    });
    act(() => result.current.clear());
    expect(result.current.message).toBe('');
    act(() => result.current.show(dismissed, 'Verspäteter Hinweis'));
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.message).toBe('');
    act(() => result.current.show(result.current.begin(), 'Hinweis'));
    expect(result.current.message).toBe('Hinweis');
  });

  it('releases timers on unmount and ignores late callbacks after leaving the view', () => {
    const {result, unmount} = renderHook(useActionFeedback, {
      wrapper: ({children}) => createElement(StrictMode, null, children),
    });
    let attempt = 0;
    act(() => {
      attempt = result.current.begin();
      result.current.show(attempt, 'Gespeichert', 'brief');
    });
    expect(vi.getTimerCount()).toBe(1);
    const abandoned = result.current;
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => abandoned.show(attempt, 'Verspätete Antwort', 'brief'));
    expect(vi.getTimerCount()).toBe(0);
    const next = renderHook(useActionFeedback);
    expect(next.result.current.message).toBe('');
  });
});

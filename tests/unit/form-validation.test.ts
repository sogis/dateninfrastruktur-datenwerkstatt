// @vitest-environment jsdom
import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useFormValidation} from '../../src/ui/useFormValidation';
import {parameterValueError, type ParameterType} from '../../src/domain/parameterValues';

describe('Field validation after a parameter type change', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 16),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('waits for a new edit and blur or submit after resetting the value field', () => {
    const {result, rerender} = renderHook(
      ({type, value}: {type: ParameterType; value: string}) =>
        useFormValidation({value: () => parameterValueError(type, value)}),
      {initialProps: {type: 'boolean', value: ''}},
    );
    act(() => {
      result.current.change('value', parameterValueError('boolean', ''));
      result.current.validate();
    });
    expect(result.current.errors.value).toContain('true oder false');
    act(() => result.current.resetField('value'));
    rerender({type: 'decimal', value: ''});
    act(() => result.current.blur('value'));
    expect(result.current.errors.value).toBeUndefined();
    act(() => result.current.validate());
    expect(result.current.errors.value).toContain('Dezimalzahl');
    act(() => result.current.resetField('value'));
    rerender({type: 'decimal', value: 'invalid'});
    act(() => result.current.change('value', parameterValueError('decimal', 'invalid')));
    expect(result.current.errors.value).toBeUndefined();
    act(() => result.current.blur('value'));
    expect(result.current.errors.value).toContain('Dezimalzahl');
    rerender({type: 'decimal', value: '1.25'});
    act(() => result.current.change('value'));
    expect(result.current.errors.value).toBeUndefined();
  });

  it('preserves other field errors and their edit status', () => {
    const {result} = renderHook(() =>
      useFormValidation({value: () => 'Invalid value', name: () => 'Invalid name'}),
    );
    act(() => {
      result.current.change('name', 'Invalid name');
      result.current.validate();
      result.current.resetField('value');
    });
    expect(result.current.errors).toEqual({value: undefined, name: 'Invalid name'});
    act(() => expect(result.current.blur('name')).toBe(false));
    expect(result.current.errors.name).toBe('Invalid name');
  });

  it.each(['before release', 'after release'])('discards stale blur errors %s', (timing) => {
    const {result} = renderHook(() =>
      useFormValidation({value: () => 'Old boolean error', name: () => 'Invalid name'}),
    );
    act(() => document.dispatchEvent(new Event('pointerdown')));
    act(() => result.current.validate(['value', 'name'], false));
    expect(result.current.errors).toEqual({});
    if (timing === 'after release') act(() => document.dispatchEvent(new Event('pointerup')));
    act(() => result.current.resetField('value'));
    if (timing === 'before release') act(() => document.dispatchEvent(new Event('pointerup')));
    act(() => vi.advanceTimersByTime(16));
    expect(result.current.errors).toEqual({value: undefined, name: 'Invalid name'});
  });
});

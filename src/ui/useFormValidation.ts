import {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {displayNameError} from '../domain/fieldValidation';
import {nameSchema} from '../domain/workspace';

export type FieldChecks = Record<string, () => string | undefined>;

/** Ephemeral field errors only: valid values still belong to the existing session. */
export function useFormValidation(checks: FieldChecks) {
  const prefix = useId();
  const dirty = useRef(new Set<string>());
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [focus, setFocus] = useState<{key: string}>();
  const pointerDown = useRef(false);
  const pendingBlur = useRef<(() => void) | undefined>(undefined);
  const blurFrame = useRef<number | undefined>(undefined);
  useEffect(() => {
    // A collision may be resolved by editing the other field. Only clear existing errors.
    const resolved = Object.keys(errors).filter((key) => errors[key] && !checks[key]?.());
    if (resolved.length)
      setErrors((previous) => ({
        ...previous,
        ...Object.fromEntries(resolved.map((key) => [key, undefined])),
      }));
  });
  useEffect(() => {
    const down = () => {
      pointerDown.current = true;
    };
    const release = () => {
      pointerDown.current = false;
      if (pendingBlur.current)
        blurFrame.current = requestAnimationFrame(() => {
          pendingBlur.current?.();
          pendingBlur.current = undefined;
        });
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    window.addEventListener('blur', release);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', release, true);
      document.removeEventListener('pointercancel', release, true);
      window.removeEventListener('blur', release);
      if (blurFrame.current !== undefined) cancelAnimationFrame(blurFrame.current);
    };
  }, []);
  const id = (key: string) => `${prefix}-${key}`;
  useLayoutEffect(() => {
    if (!focus) return;
    const control = document.getElementById(`${prefix}-${focus.key}`);
    const target = control?.matches('input[type="file"]')
      ? control.closest('.dw-file-input')?.querySelector('button')
      : control;
    if (target instanceof HTMLElement) target.focus();
  }, [focus, prefix]);
  const validate = (keys = Object.keys(checks), focusFirst = true) => {
    const next = Object.fromEntries(keys.map((key) => [key, checks[key]?.()]));
    const showErrors = () => setErrors((previous) => ({...previous, ...next}));
    // Do not move a clicked button between pointerdown (blur) and click.
    if (!focusFirst && pointerDown.current) pendingBlur.current = showErrors;
    else {
      pendingBlur.current = undefined;
      if (blurFrame.current !== undefined) cancelAnimationFrame(blurFrame.current);
      showErrors();
    }
    const first = keys.find((key) => next[key]);
    if (first && focusFirst) setFocus({key: first});
    return !first;
  };
  const blur = (key: string) => !dirty.current.has(key) || validate([key], false);
  const change = (key: string, nextError?: string) => {
    dirty.current.add(key);
    if (!nextError) setErrors((previous) => ({...previous, [key]: undefined}));
  };
  const reset = () => {
    pendingBlur.current = undefined;
    dirty.current.clear();
    setErrors({});
  };
  return {
    errors,
    id,
    validate,
    blur,
    change,
    reset,
    control: (key: string) => ({
      id: id(key),
      onBlur: () => {
        blur(key);
      },
    }),
  };
}

export function useNameField(
  source: string,
  noun: string,
  commitValue: (value: string) => void,
  onFailure?: (error: unknown) => void,
) {
  const [value, setValue] = useState(source);
  const previousSource = useRef(source);
  useEffect(() => {
    if (previousSource.current !== source) {
      const previous = previousSource.current;
      previousSource.current = source;
      setValue((draft) => (draft === previous ? source : draft));
    }
  }, [source]);
  const form = useFormValidation({name: () => displayNameError(value, noun)});
  const commit = (focusFirst = true) => {
    if (!form.validate(['name'], focusFirst)) return false;
    const normalized = nameSchema.parse(value);
    try {
      if (normalized !== source) commitValue(normalized);
    } catch (error) {
      if (!onFailure) throw error;
      onFailure(error);
      return false;
    }
    setValue(normalized);
    return true;
  };
  return {
    value,
    error: form.errors.name,
    commit,
    input: {
      id: form.id('name'),
      value,
      required: true,
      maxLength: 120,
      onChange: (event: {target: {value: string}}) => {
        const next = event.target.value;
        setValue(next);
        form.change('name', displayNameError(next, noun));
      },
      onBlur: () => {
        if (value !== source) commit(false);
      },
    },
  };
}

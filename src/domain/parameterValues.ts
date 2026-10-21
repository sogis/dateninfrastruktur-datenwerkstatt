import type {ParameterValue} from './model';
import {parameterSchema} from './workspace';

export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'int64'
  | 'decimal'
  | 'date'
  | 'timestamp';
export interface ParameterRow {
  name: string;
  type: ParameterType;
  value: string;
}

export function parameterNameError(name: string, others: readonly string[]) {
  if (!name) return 'Bitte gib einen Parameternamen ein.';
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))
    return 'Beginne mit einem Buchstaben und verwende nur Buchstaben, Ziffern oder Unterstriche.';
  if (others.includes(name)) return 'Dieser Parametername wird bereits verwendet.';
}
export function parseParameterValue(type: ParameterType, value: string): ParameterValue {
  if (type === 'boolean' && !['true', 'false'].includes(value))
    throw Error('Bitte gib true oder false ein.');
  if (type === 'number' && !value.trim()) throw Error('Bitte gib eine Zahl ein.');
  return parameterSchema.parse(
    type === 'null'
      ? null
      : type === 'number'
        ? Number(value)
        : type === 'boolean'
          ? value === 'true'
          : type === 'string'
            ? value
            : {type, value},
  );
}
export function parameterValueError(type: ParameterType, value: string) {
  try {
    parseParameterValue(type, value);
  } catch {
    const messages: Record<ParameterType, string> = {
      string: 'Bitte gib einen gültigen Text ein.',
      null: 'Bitte wähle NULL aus.',
      number: 'Bitte gib eine endliche Zahl innerhalb des sicheren Zahlenbereichs ein.',
      boolean: 'Bitte gib true oder false ein.',
      int64: 'Bitte gib eine ganze Zahl im Int64-Bereich ein.',
      decimal: 'Bitte gib eine Dezimalzahl mit Punkt als Dezimalzeichen ein.',
      date: 'Bitte gib ein gültiges Datum als JJJJ-MM-TT ein.',
      timestamp: 'Bitte gib einen gültigen ISO-Zeitstempel mit Zeitzone ein.',
    };
    return messages[type];
  }
}

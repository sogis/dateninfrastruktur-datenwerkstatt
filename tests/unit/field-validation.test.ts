import {describe, expect, it} from 'vitest';
import {
  bindingNameError,
  displayNameError,
  sqlNameError,
  csvColumnNameError,
  requiredValueError,
} from '../../src/domain/fieldValidation';
import {
  parameterValueError,
  parseParameterValue,
  parameterNameError,
} from '../../src/domain/parameterValues';

describe('Required fields preserve the existing naming contracts', () => {
  it('explains empty, long and invalid display names without losing Unicode', () => {
    expect(displayNameError('   ', 'Projektnamen')).toBe('Bitte gib einen Projektnamen ein.');
    expect(displayNameError('  Öffentliche Ölten  ')).toBeUndefined();
    expect(displayNameError('x'.repeat(121))).toContain('120');
    expect(displayNameError('bad\nname')).toContain('Steuerzeichen');
  });
  it('keeps technical SQL names distinct from display names, including tombstones', () => {
    expect(sqlNameError('öffentlich')).toBeDefined();
    expect(sqlNameError('__dw_intern')).toContain('reserviert');
    expect(sqlNameError('alte_tabelle', ['alte_tabelle'])).toContain('reserviert');
    expect(sqlNameError('tabelle_2', ['alte_tabelle'])).toBeUndefined();
  });
  it('preserves reserved R bindings', () => {
    for (const value of ['', 'if', 'params', 'lab_daten', '_daten', 'x'.repeat(65)])
      expect(bindingNameError(value)).toBeDefined();
    expect(bindingNameError('daten_2')).toBeUndefined();
  });
  it('checks CSV names without adding trimming or SQL-name restrictions', () => {
    expect(requiredValueError('')).toBeDefined();
    expect(requiredValueError('\t')).toBeUndefined();
    expect(csvColumnNameError('', [])).toBeDefined();
    expect(csvColumnNameError('Name mit Umlauten ä', [])).toBeUndefined();
    expect(csvColumnNameError('id', ['id'])).toContain('bereits');
    expect(csvColumnNameError(' ', [])).toBeUndefined();
  });
  it('preserves string, NULL, zero and exact typed parameters', () => {
    expect(parseParameterValue('string', '')).toBe('');
    expect(parseParameterValue('null', '')).toBeNull();
    expect(parseParameterValue('number', '0')).toBe(0);
    expect(parseParameterValue('int64', '9007199254740993')).toEqual({
      type: 'int64',
      value: '9007199254740993',
    });
    expect(parameterValueError('number', '')).toBeDefined();
    expect(parameterValueError('number', 'Infinity')).toBeDefined();
    expect(parameterValueError('boolean', '')).toBeDefined();
    expect(parameterValueError('int64', '9223372036854775808')).toBeDefined();
    expect(parameterValueError('date', '2026-02-30')).toBeDefined();
    expect(parameterNameError('id', ['id'])).toContain('bereits');
  });
});

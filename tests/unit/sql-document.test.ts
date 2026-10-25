import {expect, it} from 'vitest';
import {MAX_SQL_FILE_BYTES, checkSqlFile, parseSqlFile} from '../../src/application/sqlDocument';

it('loads exact UTF-8 SQL text and derives its document name without executing or interpreting it', () => {
  const code = "-- Grüezi 👋\r\nSELECT '001', '<script>', $jahr;\r\n";
  expect(parseSqlFile(' Auswertung.SQL', new TextEncoder().encode(code))).toEqual({
    name: 'Auswertung',
    code,
  });
  expect(parseSqlFile('.sql', new Uint8Array())).toEqual({name: 'SQL-Abfrage', code: ''});
  expect(parseSqlFile('BOM.sql', new Uint8Array([239, 187, 191, 83]))).toEqual({
    name: 'BOM',
    code: 'S',
  });
});

it('accepts the exact byte limit and rejects oversize, invalid UTF-8 and wrong extensions', () => {
  expect(() => checkSqlFile('gross.sql', MAX_SQL_FILE_BYTES)).not.toThrow();
  const bytes = new Uint8Array(MAX_SQL_FILE_BYTES).fill(32);
  expect(parseSqlFile('gross.sql', bytes).code).toHaveLength(MAX_SQL_FILE_BYTES);
  expect(() => checkSqlFile('gross.sql', MAX_SQL_FILE_BYTES + 1)).toThrow('höchstens 1 MiB');
  expect(() => parseSqlFile('gross.sql', new Uint8Array(MAX_SQL_FILE_BYTES + 1))).toThrow(
    'höchstens 1 MiB',
  );
  expect(() => parseSqlFile('kaputt.sql', new Uint8Array([0xc3, 0x28]))).toThrow('UTF-8');
  expect(() => parseSqlFile('kein-sql.txt', new Uint8Array())).toThrow('Endung .sql');
});

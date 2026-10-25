import {AppFailure} from './errors';
import {nameSchema} from '../domain/workspace';

export const MAX_SQL_FILE_BYTES = 1024 * 1024;

export function checkSqlFile(name: string, bytes: number) {
  if (!/\.sql$/i.test(name))
    throw new AppFailure('IMPORT_INVALID', 'Bitte wähle eine SQL-Datei mit der Endung .sql.');
  if (bytes > MAX_SQL_FILE_BYTES)
    throw new AppFailure('LIMIT_EXCEEDED', 'Die SQL-Datei darf höchstens 1 MiB gross sein.');
}

export function parseSqlFile(fileName: string, bytes: Uint8Array) {
  checkSqlFile(fileName, bytes.byteLength);
  let code: string;
  try {
    code = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
  } catch {
    throw new AppFailure('IMPORT_INVALID', 'Die SQL-Datei muss als UTF-8 gespeichert sein.');
  }
  const name = nameSchema.parse(fileName.slice(0, -4).trim().slice(0, 120) || 'SQL-Abfrage');
  return {name, code};
}

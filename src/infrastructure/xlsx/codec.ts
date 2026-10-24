import {z} from 'zod';
import {AppFailure} from '../../application/errors';
import {validateExactText} from '../../application/rTypeCodec';
import type {TableSchema} from '../../domain/model';
import {tableSchema} from '../../domain/workspace';

export const xlsxLimits = Object.freeze({
  rows: 100000,
  columns: 16384,
  cellCharacters: 32767,
  bytes: 67108864,
});

const envelope = z.strictObject({schema: z.unknown(), rows: z.array(z.unknown())});
const textRow = z.array(z.string().nullable());
const encoder = new TextEncoder();
const integerType = /^(?:U?TINYINT|U?SMALLINT|U?INTEGER|U?BIGINT|U?HUGEINT)$/;
const decimalType = /^DECIMAL\(\d+,\s*\d+\)$/;
const numericText = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const specialNumber = /^[+-]?(?:nan|inf|infinity)$/i;
const timestampType = /^(?:TIMESTAMP(?:_S|_MS|_NS|TZ)?|TIMESTAMP WITH TIME ZONE)$/;
const timeType = /^(?:TIME|TIMETZ|TIME WITH TIME ZONE)$/;

export interface XlsxInput {
  schema: TableSchema;
  rows: (string | null)[][];
  payloadBytes: number;
}
export type XlsxCell = string | number | boolean | null;

function unsupported(message: string): never {
  throw new AppFailure('TYPE_UNSUPPORTED', message);
}
function limit(message: string): never {
  throw new AppFailure('LIMIT_EXCEEDED', `${message} Es wurde nichts gekürzt.`);
}
export function checkXlsxBudget(payloadBytes: number, outputBytes = 0) {
  if (
    !Number.isSafeInteger(payloadBytes) ||
    !Number.isSafeInteger(outputBytes) ||
    payloadBytes < 0 ||
    outputBytes < 0 ||
    payloadBytes + outputBytes > xlsxLimits.bytes
  )
    limit('XLSX überschreitet das gemeinsame Bytebudget von 64 MiB.');
}

/** Validate the structured-clone boundary before allocating a workbook. */
export function validateXlsxInput(value: unknown): XlsxInput {
  const parsed = envelope.safeParse(value);
  if (!parsed.success) throw new AppFailure('VALIDATION_FAILED', 'Ungültige XLSX-Exportdaten.');
  if (parsed.data.rows.length > xlsxLimits.rows)
    limit('XLSX unterstützt hier höchstens 100’000 Datenzeilen.');
  const schemaResult = tableSchema.safeParse(parsed.data.schema);
  if (!schemaResult.success)
    throw new AppFailure('VALIDATION_FAILED', 'Ungültiges Tabellenschema für XLSX.');
  const schema: TableSchema = {
    metadata: schemaResult.data.metadata,
    columns: schemaResult.data.columns.map(({description, ...column}) => ({
      ...column,
      ...(description === undefined ? {} : {description}),
    })),
  };
  if (!schema.columns.length)
    unsupported('Eine Tabelle ohne Spalten kann nicht als XLSX exportiert werden.');
  if (schema.columns.length > xlsxLimits.columns)
    limit('XLSX unterstützt höchstens 16’384 Spalten.');
  for (const column of schema.columns) {
    validateText(column.name);
    columnKind(column.logicalType, column.name);
  }
  // Count UTF-8 structured payload bytes, including row/cell delimiters and NULLs.
  let payloadBytes = encoder.encode(JSON.stringify({schema, rows: []})).byteLength;
  checkXlsxBudget(payloadBytes);
  const rows: (string | null)[][] = [];
  for (const [index, candidate] of parsed.data.rows.entries()) {
    if (!Array.isArray(candidate) || candidate.length !== schema.columns.length)
      throw new AppFailure(
        'VALIDATION_FAILED',
        `XLSX-Zeile ${index + 1}: Spaltenzahl stimmt nicht.`,
      );
    const result = textRow.safeParse(candidate);
    if (!result.success)
      throw new AppFailure('VALIDATION_FAILED', `XLSX-Zeile ${index + 1}: Ungültige Zelle.`);
    for (const [col, cell] of result.data.entries()) {
      if (cell === null) {
        if (!schema.columns[col]!.nullable)
          unsupported(`${schema.columns[col]!.name}: NULL in einer nicht-nullbaren Spalte.`);
      } else validateText(cell);
    }
    payloadBytes += encoder.encode(JSON.stringify(result.data)).byteLength + (index ? 1 : 0);
    checkXlsxBudget(payloadBytes);
    rows.push(result.data);
  }
  return {schema, rows, payloadBytes};
}

function validateText(value: string) {
  // Counting UTF-16 code units also bounds supplementary characters conservatively.
  if (value.length > xlsxLimits.cellCharacters)
    limit('Eine XLSX-Zelle oder Spaltenüberschrift überschreitet 32’767 Zeichen.');
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff))
        unsupported('XLSX-Text enthält eine ungültige Unicode-Zeichenfolge.');
    } else if (code >= 0xdc00 && code <= 0xdfff)
      unsupported('XLSX-Text enthält eine ungültige Unicode-Zeichenfolge.');
  }
}

/** OOXML Xstring escaping, applied before ExcelJS performs ordinary XML escaping. */
export function xlsxText(value: string): string {
  validateText(value);
  return value
    .replace(/_x(?=[0-9a-f]{4}_)/gi, (prefix) => `_x005F_${prefix.slice(1)}`)
    .replace(
      /[\u0000-\u0008\u000b-\u001f\ufffe\uffff]/g,
      (character) => `_x${character.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}_`,
    );
}

type ColumnKind = 'number' | 'decimal' | 'boolean' | 'text' | 'date' | 'timestamp' | 'time';
function columnKind(type: string, name: string): ColumnKind {
  if (integerType.test(type) || ['FLOAT', 'DOUBLE', 'REAL'].includes(type)) return 'number';
  if (decimalType.test(type)) return 'decimal';
  if (type === 'BOOLEAN') return 'boolean';
  if (type === 'DATE') return 'date';
  if (timestampType.test(type)) return 'timestamp';
  if (timeType.test(type)) return 'time';
  if (
    ['VARCHAR', 'CHAR', 'BPCHAR', 'UUID', 'BIT', 'INTERVAL'].includes(type) ||
    /^ENUM\(/.test(type)
  )
    return 'text';
  return unsupported(
    `${name}: ${type} wird für XLSX nicht unterstützt. Bitte ausdrücklich als VARCHAR übernehmen.`,
  );
}

function decimalParts(text: string) {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) return undefined;
  let digits = `${match[2] ?? ''}${match[3] ?? ''}`.replace(/^0+/, '');
  let exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0);
  const trailing = /0+$/.exec(digits)?.[0].length ?? 0;
  if (trailing) {
    digits = digits.slice(0, -trailing);
    exponent += trailing;
  }
  if (!digits) return {key: '0', significant: 1};
  return {key: `${match[1] === '-' ? '-' : ''}${digits}e${exponent}`, significant: digits.length};
}
export function excelNumberIsExact(text: string): boolean {
  if (!numericText.test(text)) return false;
  const number = Number(text);
  if (!Number.isFinite(number) || Object.is(number, -0)) return false;
  const absolute = Math.abs(number);
  if (absolute && (absolute < 2.2250738585072014e-308 || absolute > 9.99999999999999e307))
    return false;
  const original = decimalParts(text),
    roundTrip = decimalParts(String(number));
  return !!original && original.significant <= 15 && original.key === roundTrip?.key;
}

function validDate(text: string, name: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text))
    unsupported(`${name}: Datum ist nicht als exakter ISO-Text darstellbar.`);
  const date = new Date(`${text}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text)
    unsupported(`${name}: Ungültiges Datum.`);
  return text;
}
function temporalText(value: string, type: string, name: string) {
  if (type === 'DATE') return validDate(value, name);
  const timestamp = timestampType.test(type);
  const match =
    /^(?:(\d{4}-\d{2}-\d{2})[ T])?(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}(?::?\d{2})?)?$/.exec(
      value,
    );
  if (!match || timestamp !== !!match[1])
    unsupported(`${name}: Zeitwert ist nicht als exakter ISO-Text darstellbar.`);
  const [, date, hour, minute, second, fraction = '', zone] = match;
  const precision =
    type === 'TIMESTAMP_NS' ? 9 : type === 'TIMESTAMP_MS' ? 3 : type === 'TIMESTAMP_S' ? 0 : 6;
  if (fraction.length > precision + 1)
    unsupported(`${name}: Zeitwert überschreitet die Auflösung von ${type}.`);
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)
    unsupported(`${name}: Ungültiger Zeitwert.`);
  if (date) validDate(date, name);
  let offset = 0;
  if (zone && zone !== 'Z') {
    const offsetMatch = /^([+-])(\d{2})(?::?(\d{2}))?$/.exec(zone)!;
    const hours = Number(offsetMatch[2]),
      minutes = Number(offsetMatch[3] ?? 0);
    if (hours > 23 || minutes > 59) unsupported(`${name}: Ungültiger UTC-Offset.`);
    offset = (hours * 60 + minutes) * (offsetMatch[1] === '-' ? -1 : 1);
  }
  // Shift only whole seconds. Preserve fractional seconds without JS Date rounding.
  const instant = new Date(`${date ?? '2000-01-02'}T${hour}:${minute}:${second}Z`);
  instant.setUTCMinutes(instant.getUTCMinutes() - offset);
  const iso = instant.toISOString();
  if (timestamp) {
    const zoned = !!zone || type === 'TIMESTAMPTZ' || type === 'TIMESTAMP WITH TIME ZONE';
    return `${iso.slice(0, 19)}${fraction}${zoned ? 'Z' : ''}`;
  }
  return `${iso.slice(11, 19)}${fraction}${zone || type !== 'TIME' ? 'Z' : ''}`;
}

/** Choose representation for the whole column before producing any cells. */
export function xlsxCells(input: XlsxInput): XlsxCell[][] {
  const kinds = input.schema.columns.map((column) => columnKind(column.logicalType, column.name));
  const numeric = input.schema.columns.map((column, index) => {
    if (kinds[index] !== 'number') return false;
    return input.rows.every((row) => {
      const value = row[index]!;
      if (value === null) return true;
      if (integerType.test(column.logicalType))
        validateExactText(value, column.logicalType, column.name);
      else if (!numericText.test(value) && !specialNumber.test(value))
        unsupported(`${column.name}: Ungültiger numerischer Wert.`);
      return (
        excelNumberIsExact(value) &&
        (!integerType.test(column.logicalType) || BigInt(Number(value)) === BigInt(value))
      );
    });
  });
  return input.rows.map((row) =>
    row.map((value, index) => {
      if (value === null) return null;
      const column = input.schema.columns[index]!;
      switch (kinds[index]) {
        case 'number':
          // every() can stop early when a column is kept as text, so validate all values here too.
          if (integerType.test(column.logicalType))
            validateExactText(value, column.logicalType, column.name);
          else if (!numericText.test(value) && !specialNumber.test(value))
            unsupported(`${column.name}: Ungültiger numerischer Wert.`);
          return numeric[index] ? Number(value) : xlsxText(value);
        case 'decimal':
          validateExactText(value, column.logicalType, column.name);
          return xlsxText(value);
        case 'boolean':
          if (!/^(?:true|false)$/i.test(value))
            unsupported(`${column.name}: Ungültiger Boolean-Wert.`);
          return value.toLowerCase() === 'true';
        case 'date':
        case 'timestamp':
        case 'time':
          return xlsxText(temporalText(value, column.logicalType, column.name));
        default:
          return xlsxText(value);
      }
    }),
  );
}

const failureCode = z.enum([
  'VALIDATION_FAILED',
  'TYPE_UNSUPPORTED',
  'LIMIT_EXCEEDED',
  'CAPABILITY_UNAVAILABLE',
]);
export const xlsxReply = z.discriminatedUnion('ok', [
  z.strictObject({ok: z.literal(true), bytes: z.instanceof(ArrayBuffer)}),
  z.strictObject({ok: z.literal(false), code: failureCode, message: z.string().max(2000)}),
]);

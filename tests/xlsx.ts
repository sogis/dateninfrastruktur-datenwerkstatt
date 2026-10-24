import {strFromU8, unzipSync} from 'fflate';

export type XlsxValue = string | number | boolean | null;
export interface XlsxInspection {
  sheet: string;
  rows: XlsxValue[][];
  formulas: number;
  cellTypes: Record<string, string>;
}

/** Independent OOXML inspection: no production writer or spreadsheet reader is reused. */
export function inspectXlsx(bytes: Uint8Array): XlsxInspection {
  const files = Object.fromEntries(
    Object.entries(unzipSync(bytes)).map(([path, content]) => [path, strFromU8(content)]),
  );
  return inspectXlsxXml(files);
}

/** Self-contained XML inspector also used by tests against a built deployment. */
export function inspectXlsxXml(files: Record<string, string>): XlsxInspection {
  const read = (path: string) => {
    const content = files[path];
    if (!content) throw new Error(`Missing XLSX entry: ${path}`);
    const document = new DOMParser().parseFromString(content, 'application/xml');
    if (document.getElementsByTagName('parsererror').length)
      throw new Error(`Invalid XML in XLSX entry: ${path}`);
    return document;
  };
  // Decode once: `_x005F_x0041_` denotes the literal string `_x0041_`.
  const text = (value: string) =>
    value.replace(/_x([0-9a-f]{4})_/gi, (_match: string, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
  const workbook = read('xl/workbook.xml');
  const sheet = workbook.getElementsByTagName('sheet')[0];
  if (!sheet) throw new Error('XLSX contains no worksheet');
  const relationships = read('xl/_rels/workbook.xml.rels');
  const relation = Array.from(relationships.getElementsByTagName('Relationship')).find(
    (entry) => entry.getAttribute('Id') === sheet.getAttribute('r:id'),
  );
  const target = relation?.getAttribute('Target');
  if (!target) throw new Error('XLSX worksheet relationship missing');
  const worksheet = read(target.startsWith('/') ? target.slice(1) : `xl/${target}`);
  const strings = files['xl/sharedStrings.xml']
    ? Array.from(read('xl/sharedStrings.xml').getElementsByTagName('si')).map((item) =>
        text(
          Array.from(item.getElementsByTagName('t'))
            .map((part) => part.textContent ?? '')
            .join(''),
        ),
      )
    : [];
  const address = (value: string) => {
    const parts = /^([A-Z]+)([1-9][0-9]*)$/.exec(value);
    if (!parts) throw new Error(`Invalid XLSX cell address: ${value}`);
    const column = [...parts[1]!].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
    return {column, row: Number(parts[2])};
  };
  const cells = Array.from(worksheet.getElementsByTagName('c'));
  const dimensions = worksheet.getElementsByTagName('dimension')[0]?.getAttribute('ref');
  const end = dimensions ? address(dimensions.split(':').at(-1)!) : {column: 0, row: 0};
  const rowCount = Array.from(worksheet.getElementsByTagName('row')).reduce(
    (max, row) => Math.max(max, Number(row.getAttribute('r'))),
    end.row,
  );
  const columnCount = cells.reduce(
    (max, cell) => Math.max(max, address(cell.getAttribute('r')!).column),
    end.column,
  );
  const rows: XlsxValue[][] = Array.from({length: rowCount}, () =>
    Array<XlsxValue>(columnCount).fill(null),
  );
  const cellTypes: Record<string, string> = {};
  for (const cell of cells) {
    const reference = cell.getAttribute('r')!;
    const {row, column} = address(reference);
    const type = cell.getAttribute('t') ?? 'n';
    cellTypes[reference] = type;
    const value = cell.getElementsByTagName('v')[0]?.textContent;
    let decoded: XlsxValue = null;
    if (type === 's') {
      const shared = strings[Number(value)];
      if (shared === undefined) throw new Error(`Invalid XLSX shared string index at ${reference}`);
      decoded = shared;
    } else if (type === 'inlineStr') {
      decoded = text(
        Array.from(cell.getElementsByTagName('t'))
          .map((part) => part.textContent ?? '')
          .join(''),
      );
    } else if (type === 'str') decoded = text(value ?? '');
    else if (type === 'b') decoded = value === '1';
    else if (value !== undefined && value !== null && value !== '') {
      decoded = Number(value);
      if (!Number.isFinite(decoded)) throw new Error(`Invalid XLSX numeric value at ${reference}`);
    }
    rows[row - 1]![column - 1] = decoded;
  }
  return {
    sheet: sheet.getAttribute('name') ?? '',
    rows,
    formulas: worksheet.getElementsByTagName('f').length,
    cellTypes,
  };
}

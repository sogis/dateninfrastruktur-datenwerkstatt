import ExcelJS from 'exceljs';
import {AppFailure} from '../../application/errors';
import {checkXlsxBudget, validateXlsxInput, xlsxCells, xlsxText} from './codec';

/** Runs only in the dedicated worker in production; exported for independent file QA. */
export async function encodeXlsxBytes(value: unknown): Promise<Uint8Array<ArrayBuffer>> {
  const input = validateXlsxInput(value);
  const cells = xlsxCells(input);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Datenwerkstatt';
  const sheet = workbook.addWorksheet('Daten');
  sheet.addRow(input.schema.columns.map((column) => xlsxText(column.name)));
  for (const values of cells) {
    const row = sheet.addRow(values);
    // Retain entirely NULL rows, including the last one, as explicit worksheet rows.
    if (values.every((value) => value === null)) row.height = 15;
  }
  const output = await workbook.xlsx.writeBuffer({useSharedStrings: true, useStyles: true});
  const bytes = new Uint8Array(output);
  checkXlsxBudget(input.payloadBytes, bytes.byteLength);
  return bytes;
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
}
// Node unit tests can call the codec without registering a global message listener.
if (typeof self !== 'undefined' && typeof document === 'undefined') {
  const scope = self as unknown as WorkerScope;
  scope.onmessage = (event) => {
    void encodeXlsxBytes(event.data).then(
      (bytes) => scope.postMessage({ok: true, bytes: bytes.buffer}, [bytes.buffer]),
      (error: unknown) => {
        const known = error instanceof AppFailure;
        scope.postMessage(
          {
            ok: false,
            code: known ? error.code : 'CAPABILITY_UNAVAILABLE',
            message: (known ? error.message : 'Die XLSX-Datei konnte nicht erzeugt werden.').slice(
              0,
              2000,
            ),
          },
          [],
        );
      },
    );
  };
}

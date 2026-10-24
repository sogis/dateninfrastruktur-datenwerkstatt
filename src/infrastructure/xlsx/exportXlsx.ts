import {AppFailure} from '../../application/errors';
import type {TableSchema} from '../../domain/model';
import {checkXlsxBudget, validateXlsxInput, xlsxReply} from './codec';

/** One worker per bounded export; termination releases every workbook on every exit. */
export async function exportXlsx(
  schema: TableSchema,
  rows: (string | null)[][],
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const cancelled = () =>
    new AppFailure('CANCELLED', 'XLSX-Export wurde abgebrochen; der Worker wurde beendet.');
  if (signal.aborted) throw cancelled();
  const input = validateXlsxInput({schema, rows});
  if (signal.aborted) throw cancelled();
  let worker: Worker;
  try {
    worker = new Worker(new URL('./xlsx.worker.ts', import.meta.url), {
      type: 'module',
      name: 'datenwerkstatt-xlsx',
    });
  } catch {
    throw new AppFailure(
      'CAPABILITY_UNAVAILABLE',
      'Der XLSX-Worker konnte nicht gestartet werden.',
    );
  }
  const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      signal.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    };
    const finish = (
      result: {ok: true; bytes: Uint8Array<ArrayBuffer>} | {ok: false; error: unknown},
    ) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (result.ok) resolve(result.bytes);
      else reject(result.error);
    };
    const abort = () => finish({ok: false, error: cancelled()});
    signal.addEventListener('abort', abort, {once: true});
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (signal.aborted) return abort();
      try {
        const result = xlsxReply.safeParse(event.data);
        if (!result.success)
          throw new AppFailure('VALIDATION_FAILED', 'Ungültige Antwort des XLSX-Workers.');
        if (!result.data.ok) throw new AppFailure(result.data.code, result.data.message);
        const output = new Uint8Array(result.data.bytes);
        checkXlsxBudget(input.payloadBytes, output.byteLength);
        if (output[0] !== 0x50 || output[1] !== 0x4b || output[2] !== 3 || output[3] !== 4)
          throw new AppFailure('VALIDATION_FAILED', 'Der XLSX-Worker lieferte keine XLSX-Datei.');
        finish({ok: true, bytes: output});
      } catch (error: unknown) {
        finish({ok: false, error});
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish({
        ok: false,
        error: new AppFailure('CAPABILITY_UNAVAILABLE', 'Der XLSX-Worker ist fehlgeschlagen.'),
      });
    };
    worker.onmessageerror = () =>
      finish({
        ok: false,
        error: new AppFailure(
          'VALIDATION_FAILED',
          'Die XLSX-Workerantwort konnte nicht gelesen werden.',
        ),
      });
    try {
      if (signal.aborted) abort();
      else worker.postMessage({schema: input.schema, rows: input.rows});
    } catch {
      finish({
        ok: false,
        error: new AppFailure(
          'CAPABILITY_UNAVAILABLE',
          'Die XLSX-Exportdaten konnten nicht an den Worker übertragen werden.',
        ),
      });
    }
  });
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

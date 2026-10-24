// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {unzipSync, strFromU8} from 'fflate';
import type {TableSchema} from '../../src/domain/model';
import {
  checkXlsxBudget,
  excelNumberIsExact,
  validateXlsxInput,
  xlsxCells,
  xlsxLimits,
  xlsxText,
} from '../../src/infrastructure/xlsx/codec';
import {encodeXlsxBytes} from '../../src/infrastructure/xlsx/xlsx.worker';
import {exportXlsx} from '../../src/infrastructure/xlsx/exportXlsx';

function schema(types: string[]): TableSchema {
  return {
    metadata: {},
    columns: types.map((logicalType, index) => ({
      name: `Spalte ${index + 1}`,
      logicalType,
      nullable: true,
      roles: [],
      metadata: {},
    })),
  };
}
const input = (types: string[], rows: (string | null)[][]) =>
  validateXlsxInput({schema: schema(types), rows});

describe('XLSX exact bounded codec', () => {
  it('keeps unsafe numeric columns and DECIMAL entirely as exact text', () => {
    expect(
      xlsxCells(
        input(
          ['BIGINT', 'DOUBLE', 'DECIMAL(18,4)'],
          [
            ['1', '0.1', '123.4500'],
            ['9007199254740993', '0.30000000000000004', null],
          ],
        ),
      ),
    ).toEqual([
      ['1', '0.1', '123.4500'],
      ['9007199254740993', '0.30000000000000004', null],
    ]);
  });
  it('writes safe numbers and booleans natively while preserving missing values', () => {
    expect(
      xlsxCells(
        input(
          ['INTEGER', 'DOUBLE', 'BOOLEAN'],
          [
            ['42', '1.23456789012345', 'true'],
            [null, '1e20', 'false'],
          ],
        ),
      ),
    ).toEqual([
      [42, 1.23456789012345, true],
      [null, 1e20, false],
    ]);
  });
  it('retains nonfinite numbers, signed zero and out-of-Excel magnitudes as text', () => {
    for (const special of ['nan', 'inf', '-inf', '-0', '1e308', '1e-310'])
      expect(xlsxCells(input(['DOUBLE'], [['1'], [special]]))).toEqual([['1'], [special]]);
    for (const value of ['123456789012345', '0.0000000000000012345', '1e20', '0'])
      expect(excelNumberIsExact(value), value).toBe(true);
    for (const value of ['1234567890123456', '9007199254740993', '1.234567890123456', 'nan', '-0'])
      expect(excelNumberIsExact(value), value).toBe(false);
    expect(xlsxCells(input(['HUGEINT'], [['1'], ['100000000000000000000000']]))).toEqual([
      ['1'],
      ['100000000000000000000000'],
    ]);
  });
  it('normalizes timestamps to UTC ISO text without rounding fractional seconds', () => {
    expect(
      xlsxCells(
        input(
          ['DATE', 'TIMESTAMP_NS', 'TIMESTAMPTZ', 'TIME'],
          [
            [
              '1850-01-01',
              '2026-10-24 23:59:59.123456789',
              '2026-10-25 00:30:01.123456+02',
              '12:30:00.123456',
            ],
          ],
        ),
      ),
    ).toEqual([
      [
        '1850-01-01',
        '2026-10-24T23:59:59.123456789',
        '2026-10-24T22:30:01.123456Z',
        '12:30:00.123456',
      ],
    ]);
    for (const value of [
      '2026-02-30 12:00:00',
      '2026-01-01 24:00:00',
      '2026-01-01 00:00:00.123456789',
    ])
      expect(() => xlsxCells(input(['TIMESTAMP'], [[value]]))).toThrow();
  });
  it('escapes Xstrings once and preserves Unicode, CR, C0 and literal escape-looking text', () => {
    expect(xlsxText('a\0\r\n\t\u0001\ufffe\uffff_x0041_ ü😀')).toBe(
      'a_x0000__x000D_\n\t_x0001__xFFFE__xFFFF__x005F_x0041_ ü😀',
    );
    expect(xlsxText('_x0041_x0042_')).toBe('_x005F_x0041_x005F_x0042_');
    expect(xlsxText('_X0041_X0042_')).toBe('_x005F_X0041_x005F_X0042_');
    expect(xlsxText('_x00aB_')).toBe('_x005F_x00aB_');
    expect(xlsxText('=1+1')).toBe('=1+1');
    expect(() => xlsxText('\ud800')).toThrow(/Unicode/);
    expect(() => xlsxText('\udc00')).toThrow(/Unicode/);
  });
  it('rejects unsupported structural/BLOB types and malformed boundary values', () => {
    for (const type of [
      'BLOB',
      'INTEGER[]',
      'STRUCT(a INTEGER)',
      'MAP(VARCHAR, INTEGER)',
      'UNION(a INTEGER)',
    ])
      expect(() => input([type], [])).toThrow(/VARCHAR/);
    for (const candidate of [
      undefined,
      {},
      {schema: schema(['VARCHAR']), rows: [[1]]},
      {schema: schema(['VARCHAR']), rows: [[]]},
      {schema: schema(['VARCHAR']), rows: [], extra: 1},
    ])
      expect(() => validateXlsxInput(candidate)).toThrow();
    expect(() => xlsxCells(input(['BOOLEAN'], [['1']]))).toThrow(/Boolean/);
    expect(() =>
      xlsxCells(input(['BIGINT'], [['1'], ['9007199254740993'], ['not a number']])),
    ).toThrow();
    const nonNullable = schema(['VARCHAR']);
    nonNullable.columns[0]!.nullable = false;
    expect(() => validateXlsxInput({schema: nonNullable, rows: [[null]]})).toThrow(/NULL/);
  });
  it('enforces row, column, cell, actual UTF-8 payload and combined output budgets', () => {
    expect(() =>
      input(
        ['VARCHAR'],
        Array.from({length: 100001}, () => [null]),
      ),
    ).toThrow(/100’000/);
    expect(() =>
      input(
        Array.from({length: 16385}, () => 'VARCHAR'),
        [],
      ),
    ).toThrow(/16’384/);
    expect(() => input(['VARCHAR'], [['a'.repeat(32768)]])).toThrow(/32’767/);
    expect(input(['VARCHAR'], [['a'.repeat(32767)]])).toBeDefined();
    // Reusing a string keeps the test small while exercising real encoded payload accounting.
    expect(() =>
      input(
        ['VARCHAR'],
        Array.from({length: 2100}, () => ['a'.repeat(32767)]),
      ),
    ).toThrow(/64 MiB/);
    expect(() => checkXlsxBudget(xlsxLimits.bytes - 4, 4)).not.toThrow();
    expect(() => checkXlsxBudget(xlsxLimits.bytes - 4, 5)).toThrow(/64 MiB/);
  });
});

describe('XLSX files independently inspected as ZIP/XML', () => {
  function inspect(bytes: Uint8Array) {
    const files = unzipSync(bytes);
    const parse = (path: string) => {
      expect(files[path], path).toBeDefined();
      const document = new DOMParser().parseFromString(strFromU8(files[path]!), 'application/xml');
      expect(document.querySelector('parsererror')).toBeNull();
      return document;
    };
    const shared = parse('xl/sharedStrings.xml');
    const strings = [...shared.querySelectorAll('si')].map((element) => element.textContent ?? '');
    const sheet = parse('xl/worksheets/sheet1.xml');
    const cell = (ref: string) => sheet.querySelector(`c[r="${ref}"]`);
    // Independent OOXML Xstring decoding; a single pass preserves escaped literal patterns.
    const decode = (text: string) =>
      text.replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      );
    const text = (ref: string) => {
      const element = cell(ref);
      if (!element) return null;
      if (element.getAttribute('t') === 's')
        return decode(strings[Number(element.querySelector('v')!.textContent)]!);
      return element.querySelector('v')?.textContent ?? '';
    };
    return {files, sheet, shared, cell, text};
  }
  it('preserves exact text, NULL/empty-string distinction, entirely NULL rows and no formulas', async () => {
    const table = schema(['VARCHAR', 'BIGINT', 'DECIMAL(18,4)', 'BOOLEAN']);
    table.columns[0]!.name = 'Titel\r_x0041_';
    const original = ' \0\r\n\t\u0001_x0041_ _X0041_X0042_ _x00aB_ &<> ü😀 ';
    const document = inspect(
      await encodeXlsxBytes({
        schema: table,
        rows: [
          [original, '1', '1.2300', 'true'],
          ['', '9007199254740993', null, 'false'],
          ['=HYPERLINK("https://example.invalid")', null, '0.0000', null],
          [null, null, null, null],
        ],
      }),
    );
    expect(document.text('A1')).toBe(table.columns[0]!.name);
    expect(document.text('A2')).toBe(original);
    expect(document.text('A3')).toBe('');
    expect(document.text('B2')).toBe('1');
    expect(document.cell('B2')!.getAttribute('t')).toBe('s');
    expect(document.text('B3')).toBe('9007199254740993');
    expect(document.text('C2')).toBe('1.2300');
    expect(document.cell('D2')!.getAttribute('t')).toBe('b');
    expect(document.text('D2')).toBe('1');
    expect(document.cell('C3')).toBeNull();
    expect(document.sheet.querySelector('row[r="5"]')).not.toBeNull();
    expect(document.sheet.querySelectorAll('row')).toHaveLength(5);
    expect(document.sheet.querySelectorAll('f')).toHaveLength(0);
    expect(
      [...document.shared.querySelectorAll('t')].some(
        (text) =>
          text.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'space') === 'preserve',
      ),
    ).toBe(true);
  });
  it('writes safe native numbers, exact nanosecond dates, headers and empty result tables', async () => {
    const document = inspect(
      await encodeXlsxBytes({
        schema: schema(['INTEGER', 'TIMESTAMP_NS']),
        rows: [['42', '2026-01-01 01:02:03.123456789']],
      }),
    );
    expect(document.cell('A2')!.getAttribute('t')).toBeNull();
    expect(document.text('A2')).toBe('42');
    expect(document.text('B2')).toBe('2026-01-01T01:02:03.123456789');
    const empty = inspect(await encodeXlsxBytes({schema: schema(['VARCHAR']), rows: []}));
    expect(empty.sheet.querySelectorAll('row')).toHaveLength(1);
    expect(empty.text('A1')).toBe('Spalte 1');
  });
  it('preserves more than one execution vector and sparse NULLs without extra missing cells', async () => {
    const rows = Array.from({length: 10000}, (_, index) => [index === 5 ? null : `${index + 0.5}`]);
    const document = inspect(await encodeXlsxBytes({schema: schema(['DOUBLE']), rows}));
    expect(document.sheet.querySelectorAll('row')).toHaveLength(10001);
    expect(document.sheet.querySelectorAll('c')).toHaveLength(10000);
    expect(document.cell('A7')).toBeNull();
    expect(document.text('A10001')).toBe('9999.5');
  });
});

class FakeWorker {
  static instances: FakeWorker[] = [];
  static failPost = false;
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn((_message: unknown) => {
    if (FakeWorker.failPost) throw new Error('clone failed');
  });
  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    FakeWorker.instances.push(this);
  }
  reply(data: unknown) {
    this.onmessage?.({data} as MessageEvent<unknown>);
  }
}
describe('XLSX worker ownership and unknown reply boundary', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeWorker.failPost = false;
    vi.stubGlobal('Worker', FakeWorker);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('starts lazily, returns bytes and terminates on success', async () => {
    expect(FakeWorker.instances).toHaveLength(0);
    const controller = new AbortController();
    const pending = exportXlsx(schema(['VARCHAR']), [['a']], controller.signal);
    const worker = FakeWorker.instances[0]!;
    expect(worker.url.pathname).toContain('xlsx.worker.ts');
    expect(worker.options).toEqual({type: 'module', name: 'datenwerkstatt-xlsx'});
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    worker.reply({ok: true, bytes: new Uint8Array([80, 75, 3, 4, 1]).buffer});
    const result = await pending;
    expect(new Uint8Array(await new Response(result).arrayBuffer())).toEqual(
      new Uint8Array([80, 75, 3, 4, 1]),
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    controller.abort();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it('terminates promptly on abort and never creates a worker for already-aborted input', async () => {
    const controller = new AbortController();
    const pending = exportXlsx(schema(['VARCHAR']), [['a']], controller.signal);
    const assertion = expect(pending).rejects.toMatchObject({code: 'CANCELLED'});
    const worker = FakeWorker.instances[0]!;
    controller.abort();
    await assertion;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    await expect(exportXlsx(schema(['VARCHAR']), [], controller.signal)).rejects.toMatchObject({
      code: 'CANCELLED',
    });
    expect(FakeWorker.instances).toHaveLength(1);
  });
  it('rejects unknown/malformed replies and worker error replies, terminating every worker', async () => {
    for (const reply of [
      undefined,
      {ok: true, bytes: 'not bytes'},
      {ok: true, bytes: new ArrayBuffer(0)},
      {ok: false, code: 'invented', message: 'bad'},
      {ok: false, code: 'LIMIT_EXCEEDED', message: 'Budget überschritten.'},
    ]) {
      const pending = exportXlsx(schema(['VARCHAR']), [], new AbortController().signal);
      const worker = FakeWorker.instances.at(-1)!;
      const assertion = expect(pending).rejects.toBeInstanceOf(Error);
      worker.reply(reply);
      await assertion;
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(worker.onmessage).toBeNull();
    }
  });
  it('cleans up on worker crashes, message decoding failures and postMessage failures', async () => {
    for (const kind of ['error', 'messageerror', 'post']) {
      FakeWorker.failPost = kind === 'post';
      const pending = exportXlsx(schema(['VARCHAR']), [], new AbortController().signal);
      const assertion = expect(pending).rejects.toBeInstanceOf(Error);
      const worker = FakeWorker.instances.at(-1)!;
      if (kind === 'error') worker.onerror?.({preventDefault: () => {}} as ErrorEvent);
      if (kind === 'messageerror') worker.onmessageerror?.();
      await assertion;
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(worker.onerror).toBeNull();
      expect(worker.onmessageerror).toBeNull();
    }
  });
});

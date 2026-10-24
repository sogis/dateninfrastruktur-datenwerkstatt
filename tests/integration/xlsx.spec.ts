import {expect, test} from '../persistentBrowser';
import config from '../../public/runtime-config.json' with {type: 'json'};

test('XLSX SQL: full frozen random result survives paging, keeping and reopening', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const inspectPath = '/tests/xlsx.ts';
    const {inspectXlsx} = (await import(inspectPath)) as typeof import('../xlsx');
    const {service, session} = await sqlHarness();
    const signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('sql');
      session.updateAnalysis(id, {
        code: 'SELECT i, random() AS random_value FROM range(350) t(i) ORDER BY i DESC',
      });
      const app = session.getAnalyses();
      const runId = await app.run(id);
      const run = session.document.runs[runId]!;
      if (run.status !== 'succeeded') throw new Error(JSON.stringify(run));
      const resultId = run.resultIds[0]!;
      const original = await app.page(resultId, {offset: 0, size: 500, sort: []}, signal);
      await app.page(
        resultId,
        {offset: 100, size: 100, sort: [{column: 'i', direction: 'asc'}]},
        signal,
      );
      await app.keep(resultId);
      session.updateAnalysis(id, {code: 'SELECT 999 AS changed_editor'});
      await session.flush();
      const workspaceId = session.document.workspace.id;
      await service.close();
      const reopened = await service.open(workspaceId);
      const before = JSON.stringify(reopened.document);
      const bytes = new Uint8Array(
        await new Response(
          await reopened.getAnalyses().export(resultId, 'xlsx', signal),
        ).arrayBuffer(),
      );
      return {
        original: original.rows,
        workbook: inspectXlsx(bytes),
        before,
        after: JSON.stringify(reopened.document),
      };
    } finally {
      await service.close();
    }
  });
  expect(proof.workbook.rows[0]).toEqual(['i', 'random_value']);
  expect(proof.workbook.rows).toHaveLength(351);
  expect(proof.workbook.rows.slice(1).map((row) => row.map((value) => String(value)))).toEqual(
    proof.original,
  );
  expect(proof.workbook.rows[1]![0]).toBe(349);
  expect(proof.workbook.formulas).toBe(0);
  expect(proof.before).toBe(proof.after);
});

test('XLSX SQL: exact values, text safety, NULL and empty string remain distinct', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const inspectPath = '/tests/xlsx.ts';
    const {inspectXlsx} = (await import(inspectPath)) as typeof import('../xlsx');
    const {service, session} = await sqlHarness();
    const signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('sql');
      const values = {
        small: '42::INTEGER',
        decimal: '123456789012345678.1234::DECIMAL(22,4)',
        big: '9007199254740993::BIGINT',
        precise: '1.2345678901234567::DOUBLE',
        ordinary: '1.5::DOUBLE',
        truth: 'true',
        missing: 'NULL::VARCHAR',
        empty: "''",
        identifier: "'001'",
        formula: "'=1+1'",
        special: '$special',
        constructor: "'constructor'",
        proto: "'__proto__'",
        literal_escape: "'_x0041_'",
        day: "DATE '2026-10-24'",
        time: "TIME '12:34:56.123456'",
        moment: "TIMESTAMP '2026-10-24 12:34:56.123456'",
        instant: "TIMESTAMPTZ '2026-10-24 14:34:56.123456+02:00'",
        ['__proto__']: "'quoted column value'",
      };
      const projection = Object.entries(values)
        .map(([name, value]) => `CASE WHEN i=0 THEN ${value} ELSE NULL END AS "${name}"`)
        .join(',');
      session.updateAnalysis(id, {
        code: `SELECT ${projection} FROM range(4) t(i) ORDER BY i`,
        parameters: {special: 'Grüezi <>&"\'\r\n\t😀�_X0041_'},
      });
      const app = session.getAnalyses();
      const runId = await app.run(id);
      const run = session.document.runs[runId]!;
      if (run.status !== 'succeeded') throw new Error(JSON.stringify(run));
      const bytes = new Uint8Array(
        await new Response(await app.export(run.resultIds[0]!, 'xlsx', signal)).arrayBuffer(),
      );
      return inspectXlsx(bytes);
    } finally {
      await service.close();
    }
  });
  expect(proof.rows).toHaveLength(5);
  expect(proof.rows[1]!.slice(0, 14)).toEqual([
    42,
    '123456789012345678.1234',
    '9007199254740993',
    '1.2345678901234567',
    1.5,
    true,
    null,
    '',
    '001',
    '=1+1',
    'Grüezi <>&"\'\r\n\t😀�_X0041_',
    'constructor',
    '__proto__',
    '_x0041_',
  ]);
  expect(proof.rows[1]![14]).toBe('2026-10-24');
  expect(proof.rows[1]![15]).toBe('12:34:56.123456');
  expect(proof.rows[1]![16]).toMatch(/^2026-10-24T12:34:56\.123456$/);
  expect(proof.rows[1]![17]).toMatch(/^2026-10-24[T ]12:34:56\.123456(?:Z|\+00(?::00)?)$/);
  expect(proof.rows[0]![18]).toBe('__proto__');
  expect(proof.rows[1]![18]).toBe('quoted column value');
  expect(proof.rows.slice(2)).toEqual(Array.from({length: 3}, () => Array(19).fill(null)));
  expect(proof.cellTypes.G2).toBeUndefined();
  expect(['s', 'inlineStr']).toContain(proof.cellTypes.H2);
  expect(proof.formulas).toBe(0);
});

test('XLSX SQL: 10000 NULL rows, empty result and rejected exports do not corrupt the session', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const inspectPath = '/tests/xlsx.ts';
    const {inspectXlsx} = (await import(inspectPath)) as typeof import('../xlsx');
    const {service, session} = await sqlHarness();
    const signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('sql');
      const app = session.getAnalyses();
      const exportQuery = async (code: string) => {
        session.updateAnalysis(id, {code});
        const runId = await app.run(id);
        const run = session.document.runs[runId]!;
        if (run.status !== 'succeeded') throw new Error(JSON.stringify(run));
        return inspectXlsx(
          new Uint8Array(
            await new Response(await app.export(run.resultIds[0]!, 'xlsx', signal)).arrayBuffer(),
          ),
        );
      };
      const nulls = await exportQuery('SELECT NULL::VARCHAR AS missing FROM range(10000)');
      const empty = await exportQuery('SELECT 1::INTEGER AS value WHERE false');
      const errors: string[] = [];
      for (const query of [
        "SELECT repeat('x',32768) AS oversized",
        'SELECT [1,2] AS nested',
        "SELECT 'blob'::BLOB AS binary",
      ]) {
        try {
          await exportQuery(query);
          errors.push('UNEXPECTED_SUCCESS');
        } catch (error) {
          errors.push(String(error));
        }
      }
      const recovered = await exportQuery('SELECT 7::INTEGER AS recovered');
      return {
        nullCount: nulls.rows.length,
        nullHeader: nulls.rows[0],
        allNull: nulls.rows.slice(1).every((row) => row.length === 1 && row[0] === null),
        empty,
        errors,
        recovered,
      };
    } finally {
      await service.close();
    }
  });
  expect(proof.nullCount).toBe(10001);
  expect(proof.nullHeader).toEqual(['missing']);
  expect(proof.allNull).toBe(true);
  expect(proof.empty.rows).toEqual([['value']]);
  expect(proof.errors).toHaveLength(3);
  for (const error of proof.errors) expect(error).not.toBe('UNEXPECTED_SUCCESS');
  expect(proof.errors[0]).toMatch(/32767|32.?767|Zelle|Zeichen|LIMIT/i);
  expect(proof.errors[1]).toMatch(/LIST|INTEGER\[\]|unterst|Typ/i);
  expect(proof.errors[2]).toMatch(/BLOB|unterst|Typ/i);
  expect(proof.recovered.rows).toEqual([['recovered'], [7]]);
});

test('XLSX R: full dataframe, unchanged document, stale plans and failure cleanup', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async (raw) => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const inspectPath = '/tests/xlsx.ts';
    const {inspectXlsx} = (await import(inspectPath)) as typeof import('../xlsx');
    const {service, session, sqlEngines} = await sqlHarness(
      30000,
      undefined,
      raw as unknown as import('../../contracts/runtime-config').RuntimeConfig,
    );
    const signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('r');
      session.updateAnalysis(id, {
        code: 'x <- data.frame(id=seq_len(350L), text=rep(c("",NA_character_,"=1+1","constructor","__proto__","Grüezi\\r\\n_x0041_"),length.out=350L), flag=rep(c(TRUE,FALSE,NA),length.out=350L)); empty <- x[FALSE,]',
      });
      const r = session.getR();
      await r.run(id);
      const ref = r.objectList.find((object) => object.ref.name === 'x')!.ref;
      const before = JSON.stringify(session.document);
      const plan = await r.planExport(ref, 'xlsx', signal);
      const workbook = inspectXlsx(
        new Uint8Array(
          await new Response(
            await r.exportTable(
              plan.id,
              plan.issues.map((issue) => issue.id),
              signal,
            ),
          ).arrayBuffer(),
        ),
      );
      const empty = await r.planExport(
        r.objectList.find((object) => object.ref.name === 'empty')!.ref,
        'xlsx',
        signal,
      );
      const emptyBook = inspectXlsx(
        new Uint8Array(
          await new Response(
            await r.exportTable(
              empty.id,
              empty.issues.map((issue) => issue.id),
              signal,
            ),
          ).arrayBuffer(),
        ),
      );
      const sql = sqlEngines[0]!;
      const originalExport = sql.exportFile.bind(sql),
        originalRelease = sql.release.bind(sql);
      let released = 0;
      sql.release = async (table) => {
        released++;
        await originalRelease(table);
      };
      sql.exportFile = async () => {
        throw new Error('Injected XLSX writer failure');
      };
      let failed = '';
      try {
        const failedPlan = await r.planExport(ref, 'xlsx', signal);
        await r.exportTable(
          failedPlan.id,
          failedPlan.issues.map((issue) => issue.id),
          signal,
        );
      } catch (error) {
        failed = String(error);
      } finally {
        sql.exportFile = originalExport;
        sql.release = originalRelease;
      }
      const after = JSON.stringify(session.document);
      const stale = await r.planExport(ref, 'xlsx', signal);
      await r.reset();
      let staleError = '';
      try {
        await r.exportTable(
          stale.id,
          stale.issues.map((issue) => issue.id),
          signal,
        );
      } catch (error) {
        staleError = JSON.stringify(error);
      }
      return {workbook, emptyBook, before, after, failed, released, staleError};
    } finally {
      await service.close();
    }
  }, config);
  expect(proof.workbook.rows).toHaveLength(351);
  expect(proof.workbook.rows[0]).toEqual(['id', 'text', 'flag']);
  expect(proof.workbook.rows.slice(1, 7).map((row) => row[1])).toEqual([
    '',
    null,
    '=1+1',
    'constructor',
    '__proto__',
    'Grüezi\r\n_x0041_',
  ]);
  expect(proof.workbook.rows.slice(1, 4).map((row) => row[2])).toEqual([true, false, null]);
  expect(proof.workbook.rows.at(-1)![0]).toBe(350);
  expect(proof.workbook.formulas).toBe(0);
  expect(proof.emptyBook.rows).toEqual([['id', 'text', 'flag']]);
  expect(proof.before).toBe(proof.after);
  expect(proof.failed).toContain('Injected XLSX writer failure');
  expect(proof.released).toBe(1);
  expect(proof.staleError).toContain('RUNTIME_RESET');
});

for (const mode of ['abort', 'timeout'] as const)
  test(`XLSX SQL: ${mode} terminates its actual worker and permits another export`, async ({
    page,
  }) => {
    const workers: {closed: boolean}[] = [];
    page.on('worker', (worker) => {
      if (!worker.url().includes('xlsx.worker')) return;
      const record = {closed: false};
      workers.push(record);
      worker.on('close', () => {
        record.closed = true;
      });
    });
    await page.goto('/tests/spike/index.html');
    const proof = await page.evaluate(async (mode) => {
      const harnessPath = '/tests/spike/sqlHarness.ts';
      const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
      const inspectPath = '/tests/xlsx.ts';
      const {inspectXlsx} = (await import(inspectPath)) as typeof import('../xlsx');
      const {service, session} = await sqlHarness(mode === 'timeout' ? 1000 : 30000);
      const NativeWorker = Worker;
      const control = new AbortController();
      let created = 0;
      try {
        const id = session.createAnalysis('sql');
        const app = session.getAnalyses();
        session.updateAnalysis(id, {code: 'SELECT i::INTEGER AS id FROM range(100000) t(i)'});
        const runId = await app.run(id);
        const run = session.document.runs[runId]!;
        if (run.status !== 'succeeded') throw new Error(JSON.stringify(run));
        const resultId = run.resultIds[0]!;
        const before = JSON.stringify(session.document);
        // Use the real Worker constructor; only the timeout test withholds its request
        // to reproduce an unresponsive writer and exercise actual termination.
        globalThis.Worker = class extends NativeWorker {
          constructor(url: string | URL, options?: WorkerOptions) {
            super(url, options);
            if (options?.name === 'datenwerkstatt-xlsx') {
              created++;
              if (mode === 'abort') setTimeout(() => control.abort(), 0);
              else this.postMessage = () => {};
            }
          }
        };
        let failure = '';
        try {
          await app.export(resultId, 'xlsx', control.signal);
        } catch (error) {
          failure = `${String(error)} ${JSON.stringify(error)}`;
        } finally {
          globalThis.Worker = NativeWorker;
        }
        const after = JSON.stringify(session.document);
        const retained = await app.page(
          resultId,
          {offset: 99999, size: 1, sort: []},
          new AbortController().signal,
        );
        session.updateAnalysis(id, {code: 'SELECT 7::INTEGER AS recovered'});
        const recoveredRun = await app.run(id);
        const recoveredId = session.document.runs[recoveredRun]!.resultIds[0]!;
        const recovered = inspectXlsx(
          new Uint8Array(
            await new Response(
              await app.export(recoveredId, 'xlsx', new AbortController().signal),
            ).arrayBuffer(),
          ),
        );
        return {failure, before, after, retained, recovered, created};
      } finally {
        globalThis.Worker = NativeWorker;
        await service.close();
      }
    }, mode);
    expect(proof.created).toBe(1);
    expect(proof.failure).toMatch(
      mode === 'abort' ? /abort|abgebr|cancel/i : /timeout|Zeit|Limit/i,
    );
    expect(proof.before).toBe(proof.after);
    expect(proof.retained.rows).toEqual([['99999']]);
    expect(proof.recovered.rows).toEqual([['recovered'], [7]]);
    await expect.poll(() => workers[0]?.closed).toBe(true);
  });

test('XLSX SQL: closing the session terminates its worker and rejects the stale export', async ({
  page,
}) => {
  const workers: {closed: boolean}[] = [];
  const closingTriggers: Promise<void>[] = [];
  page.on('worker', (worker) => {
    if (!worker.url().includes('xlsx.worker')) return;
    const record = {closed: false};
    workers.push(record);
    worker.on('close', () => {
      record.closed = true;
    });
    // Register the actual worker's close listener before requesting session disposal.
    const trigger = page.evaluate(() => {
      const close = Reflect.get(globalThis, 'closeXlsxSession');
      if (typeof close !== 'function') throw new Error('XLSX session close callback missing');
      close();
    });
    closingTriggers.push(trigger);
    void trigger.catch(() => {});
  });
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const {service, session} = await sqlHarness();
    const NativeWorker = Worker;
    let closing: Promise<void> | undefined;
    let created = 0;
    try {
      const id = session.createAnalysis('sql');
      session.updateAnalysis(id, {code: 'SELECT i::INTEGER AS id FROM range(100000) t(i)'});
      const app = session.getAnalyses();
      const runId = await app.run(id);
      const resultId = session.document.runs[runId]!.resultIds[0]!;
      Reflect.set(globalThis, 'closeXlsxSession', () => {
        closing = service.close();
      });
      globalThis.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          if (options?.name === 'datenwerkstatt-xlsx') {
            created++;
          }
        }
      };
      let returnedBytes = false,
        failure = '';
      try {
        await new Response(
          await app.export(resultId, 'xlsx', new AbortController().signal),
        ).arrayBuffer();
        returnedBytes = true;
      } catch (error) {
        failure = String(error);
      } finally {
        globalThis.Worker = NativeWorker;
      }
      await closing;
      const scheduler = session.scheduler.getSnapshot();
      const reopened = await service.open(session.document.workspace.id);
      const staleMaterialization = reopened.document.results[resultId]!.materialization;
      reopened.updateAnalysis(id, {code: 'SELECT 7 AS recovered'});
      const recoveredRun = await reopened.getAnalyses().run(id);
      const recovered = reopened.document.runs[recoveredRun]!.status;
      return {returnedBytes, failure, created, scheduler, staleMaterialization, recovered};
    } finally {
      globalThis.Worker = NativeWorker;
      Reflect.deleteProperty(globalThis, 'closeXlsxSession');
      await service.close();
    }
  });
  await Promise.all(closingTriggers);
  expect(proof.created).toBe(1);
  expect(proof.returnedBytes).toBe(false);
  expect(proof.failure).toMatch(/abgebr|beendet|geschlossen|cancel|reset/i);
  expect(proof.scheduler).toBeNull();
  expect(proof.staleMaterialization).toEqual({kind: 'unavailable', reason: 'session-ended'});
  expect(proof.recovered).toBe('succeeded');
  await expect.poll(() => workers[0]?.closed).toBe(true);
});

test('XLSX SQL: a hard reset during source reading invalidates temporary results and restores kept data', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const harnessPath = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(harnessPath)) as typeof import('../spike/sqlHarness');
    const {service, session, sqlEngines} = await sqlHarness(1000);
    const signal = new AbortController().signal;
    const terminate = Worker.prototype.terminate;
    let terminated = 0;
    try {
      const app = session.getAnalyses(),
        sql = sqlEngines[0]!;
      const id = session.createAnalysis('sql');
      session.updateAnalysis(id, {code: 'SELECT 1 AS kept'});
      const firstRun = await app.run(id);
      const keptId = session.document.runs[firstRun]!.resultIds[0]!;
      await app.keep(keptId);
      session.updateAnalysis(id, {code: 'SELECT 2 AS temporary'});
      const secondRun = await app.run(id);
      const run = session.document.runs[secondRun]!;
      const temporaryId = run.resultIds[0]!;
      const epoch = sql.epoch;
      Worker.prototype.terminate = function () {
        terminated++;
        return terminate.call(this);
      };
      const exportFile = sql.exportFile.bind(sql);
      // Inject real, deliberately slow DuckDB work at the XLSX source-reading boundary.
      // Its real worker must stop before the export reports timeout; no fake result is returned.
      sql.exportFile = async (table, format, exportSignal) => {
        await sql.execute({
          runId: run.id,
          signal: exportSignal,
          budget: {
            maxExecutionMs: 30000,
            maxResultRows: 100000,
            maxResultBytes: 67108864,
            maxTransferBytes: 67108864,
          },
          snapshot: {
            ...run.snapshot,
            code: 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)',
            parameters: {},
          },
        });
        return exportFile(table, format, exportSignal);
      };
      let failure = '';
      try {
        await app.export(temporaryId, 'xlsx', signal);
      } catch (error) {
        failure = `${String(error)} ${JSON.stringify(error)}`;
      } finally {
        sql.exportFile = exportFile;
      }
      const epochAfter = sql.epoch;
      const temporary = session.document.results[temporaryId]!.materialization;
      const kept = session.document.results[keptId]!.materialization;
      const restored = await app.page(keptId, {offset: 0, size: 100, sort: []}, signal);
      session.updateAnalysis(id, {code: 'SELECT 7 AS recovered'});
      const recoveredRun = await app.run(id);
      const recovered = await app.page(
        session.document.runs[recoveredRun]!.resultIds[0]!,
        {offset: 0, size: 100, sort: []},
        signal,
      );
      return {failure, epoch, epochAfter, terminated, temporary, kept, restored, recovered};
    } finally {
      await service.close();
      Worker.prototype.terminate = terminate;
    }
  });
  expect(proof.failure).toMatch(/timeout|Zeit|Laufzeit/i);
  expect(proof.epochAfter).toBeGreaterThan(proof.epoch);
  expect(proof.terminated).toBeGreaterThan(0);
  expect(proof.temporary).toEqual({kind: 'unavailable', reason: 'runtime-reset'});
  expect(proof.kept.kind).toBe('artifact');
  expect(proof.restored.rows).toEqual([['1']]);
  expect(proof.recovered.rows).toEqual([['7']]);
});

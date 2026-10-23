import {test, expect} from '../persistentBrowser';
import config from '../../public/runtime-config.json' with {type: 'json'};

test('R direct exports: complete CSV/Parquet, typed values and no project publication', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async (raw) => {
    const path = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
    const {service, session, sqlEngines} = await sqlHarness(
      30000,
      undefined,
      raw as unknown as import('../../contracts/runtime-config').RuntimeConfig,
    );
    const signal = new AbortController().signal;
    try {
      const id = session.createAnalysis('r');
      session.updateAnalysis(id, {
        code: 'x <- data.frame(id=seq_len(350L), text=rep(c("001", "Grüezi;\\\"Welt\\\"", "", NA_character_, "=1+1"),70), value=rep(c(NA_real_,NaN,Inf,-Inf,1.5),70)); empty <- x[FALSE,]',
      });
      const r = session.getR();
      await r.run(id);
      const ref = r.objectList.find((o) => o.ref.name === 'x')!.ref;
      const before = JSON.stringify(session.document);
      const csvPlan = await r.planExport(ref, 'csv', signal);
      const csv = await new Response(await r.exportTable(csvPlan.id, [], signal)).text();
      const plan = await r.planExport(ref, 'parquet', signal);
      const parquet = await new Response(await r.exportTable(plan.id, [], signal)).arrayBuffer();
      const imported = await session
        .getDatasets()
        .preview(new File([parquet], 'x.parquet'), 'parquet', undefined, signal);
      const sql = sqlEngines[0]!;
      const handle = await sql.captureParquet(
        new Blob([parquet]).stream(),
        imported.schema,
        '350',
        signal,
      );
      const roundtrip = await sql.readPage(handle, {offset: 0, size: 500, sort: []}, signal);
      await sql.release(handle);
      let released = 0;
      const release = sql.release.bind(sql),
        exportFile = sql.exportFile.bind(sql);
      sql.release = async (table) => {
        released++;
        await release(table);
      };
      sql.exportFile = async () => {
        throw new Error('Injected export failure');
      };
      const failure = await r.planExport(ref, 'parquet', signal);
      let failed = '';
      try {
        await r.exportTable(failure.id, [], signal);
      } catch (e) {
        failed = String(e);
      }
      sql.exportFile = exportFile;
      sql.release = release;
      const empty = await r.planExport(
        r.objectList.find((o) => o.ref.name === 'empty')!.ref,
        'csv',
        signal,
      );
      const emptyCsv = await new Response(await r.exportTable(empty.id, [], signal)).text();
      let reused = '';
      try {
        await r.exportTable(plan.id, [], signal);
      } catch (e) {
        reused = JSON.stringify(e);
      }
      return {
        csv,
        imported,
        roundtrip,
        released,
        failed,
        emptyCsv,
        before,
        after: JSON.stringify(session.document),
        reused,
      };
    } finally {
      await service.close();
    }
  }, config);
  expect(proof.csv.trimEnd().split('\n')).toHaveLength(351);
  expect(proof.csv).toContain('"id";"text";"value"\n');
  expect(proof.csv).toContain('"001"');
  expect(proof.csv).toContain('"Grüezi;""Welt"""');
  expect(proof.csv).toContain('"=1+1"');
  expect(proof.csv).not.toContain('__dw_ordinal');
  expect(proof.csv).not.toContain('\r');
  expect(proof.emptyCsv.trimEnd().split('\n')).toHaveLength(1);
  expect(proof.imported.schema.columns.map((c) => c.logicalType)).toEqual([
    'INTEGER',
    'VARCHAR',
    'DOUBLE',
  ]);
  expect(proof.imported.rows).toHaveLength(200);
  expect(proof.roundtrip.rows).toHaveLength(350);
  expect(proof.roundtrip.rows[0]).toEqual(['1', '001', null]);
  expect(String(proof.roundtrip.rows[1]![2]).toLowerCase()).toBe('nan');
  expect(String(proof.roundtrip.rows[2]![2]).toLowerCase()).toBe('inf');
  expect(proof.roundtrip.rows[3]![1]).toBeNull();
  expect(proof.released).toBe(1);
  expect(proof.failed).toContain('Injected export failure');
  expect(proof.before).toBe(proof.after);
  expect(proof.reused).toContain('RUNTIME_RESET');
});

test('R direct exports: approvals, stale scope/mutation/reset and discarded plans', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async (raw) => {
    const path = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
    const {service, session} = await sqlHarness(30000, undefined, {
      ...raw,
      limits: {...raw.limits, rWarningRows: 1},
    } as unknown as import('../../contracts/runtime-config').RuntimeConfig);
    const signal = new AbortController().signal;
    const errors: string[] = [];
    try {
      const id = session.createAnalysis('r');
      session.updateAnalysis(id, {
        code: 'x <- data.frame(f=factor(c("b","a"), levels=c("a","b","unused")), d=as.Date(c("2026-01-01",NA)))',
      });
      const r = session.getR();
      await r.run(id);
      const ref = r.objectList.find((o) => o.ref.name === 'x')!.ref;
      const p = await r.planExport(ref, 'parquet', signal);
      try {
        await r.exportTable(p.id, [], signal);
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      const ok = await r.planExport(ref, 'parquet', signal);
      const bytes = await new Response(
        await r.exportTable(
          ok.id,
          ok.issues.map((i) => i.id),
          signal,
        ),
      ).arrayBuffer();
      const stale = await r.planExport(ref, 'csv', signal);
      session.updateAnalysis(id, {code: 'x$d[1] <- as.Date("2026-01-02")'});
      await r.run(id);
      try {
        await r.exportTable(
          stale.id,
          stale.issues.map((i) => i.id),
          signal,
        );
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      const discarded = await r.planExport(ref, 'csv', signal);
      r.discardExport(discarded.id);
      try {
        await r.exportTable(discarded.id, [], signal);
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      const reset = await r.planExport(ref, 'csv', signal);
      await r.reset();
      try {
        await r.exportTable(reset.id, [], signal);
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      return {errors, issues: p.issues, bytes: bytes.byteLength};
    } finally {
      await service.close();
    }
  }, config);
  expect(proof.issues.some((i) => i.id === 'row-warning')).toBe(true);
  expect(proof.issues.some((i) => i.id === 'export-factor-f')).toBe(true);
  expect(proof.bytes).toBeGreaterThan(0);
  expect(proof.errors).toHaveLength(4);
  expect(proof.errors[0]).toContain('CONVERSION_APPROVAL_REQUIRED');
  for (const error of proof.errors.slice(1)) expect(error).toContain('RUNTIME_RESET');
});

for (const mode of ['cancel', 'timeout'] as const)
  test(`R direct exports: genuine ${mode} terminates a busy R reader and permits recovery`, async ({
    page,
  }) => {
    const workers: {closed: boolean}[] = [];
    page.on('worker', (worker) => {
      if (worker.url().includes('webr')) {
        const record = {closed: false};
        workers.push(record);
        worker.on('close', () => {
          record.closed = true;
        });
      }
    });
    await page.goto('/tests/spike/index.html');
    const proof = await page.evaluate(
      async ({raw, mode}) => {
        const path = '/tests/spike/sqlHarness.ts';
        const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
        const {service, session} = await sqlHarness(
          30000,
          undefined,
          raw as unknown as import('../../contracts/runtime-config').RuntimeConfig,
          undefined,
          mode === 'timeout' ? 1000 : undefined,
        );
        const signal = new AbortController().signal;
        try {
          const id = session.createAnalysis('r');
          session.updateAnalysis(id, {
            code: 'assign("[[.export_slow", function(x,...) { repeat { 1+1 } }, envir=.GlobalEnv); x <- structure(data.frame(a=1L),class=c("export_slow","data.frame"))',
          });
          const r = session.getR();
          await r.run(id);
          const epoch = r.epoch;
          const control = new AbortController();
          const timer = mode === 'cancel' ? setTimeout(() => control.abort(), 500) : undefined;
          let error = '';
          try {
            await r.planExport(
              r.objectList.find((o) => o.ref.name === 'x')!.ref,
              'csv',
              control.signal,
            );
          } catch (e) {
            error = JSON.stringify(e);
          } finally {
            clearTimeout(timer);
          }
          const stopped = r.epoch > epoch;
          session.updateAnalysis(id, {code: 'x <- data.frame(a=7L)'});
          await r.run(id);
          const plan = await r.planExport(
            r.objectList.find((o) => o.ref.name === 'x')!.ref,
            'csv',
            signal,
          );
          const csv = await new Response(await r.exportTable(plan.id, [], signal)).text();
          return {error, stopped, csv};
        } finally {
          await service.close();
        }
      },
      {raw: config, mode},
    );
    expect(proof.error).toContain(mode === 'cancel' ? 'CANCELLED' : 'TIMEOUT');
    expect(workers.some((worker) => worker.closed)).toBe(true);
    expect(proof.stopped).toBe(true);
    expect(proof.csv).toContain('7');
  });

test('R direct exports: exact annotated type boundaries survive Parquet without a capture', async ({
  page,
}) => {
  const {readFile} = await import('node:fs/promises');
  const query = await readFile('fixtures/04-typgrenzen.sql', 'utf8');
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(
    async ({raw, query}) => {
      const path = '/tests/spike/sqlHarness.ts';
      const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
      const {service, session, sqlEngines} = await sqlHarness(
        30000,
        undefined,
        raw as unknown as import('../../contracts/runtime-config').RuntimeConfig,
      );
      const signal = new AbortController().signal;
      try {
        const a = session.createAnalysis('sql');
        session.updateAnalysis(a, {code: query});
        const run = await session.getAnalyses().run(a),
          resultId = session.document.runs[run]!.resultIds[0]!;
        const original = await session
          .getAnalyses()
          .page(resultId, {offset: 0, size: 100, sort: []}, signal);
        const id = session.createAnalysis('r'),
          r = session.getR();
        const transfer = await r.planToR(resultId, id, 'x', signal);
        await r.commitToR(
          transfer.id,
          transfer.issues.map((i) => i.id),
          signal,
        );
        const ref = r.objectList.find((o) => o.ref.name === 'x')!.ref;
        const before = JSON.stringify(session.document);
        const plan = await r.planExport(ref, 'parquet', signal);
        const bytes = await new Response(
          await r.exportTable(
            plan.id,
            plan.issues.map((i) => i.id),
            signal,
          ),
        ).arrayBuffer();
        const preview = await session
          .getDatasets()
          .preview(new File([bytes], 'types.parquet'), 'parquet', undefined, signal);
        const sql = sqlEngines[0]!,
          handle = await sql.captureParquet(
            new Blob([bytes]).stream(),
            preview.schema,
            '1',
            signal,
          );
        const returned = await sql.readPage(handle, {offset: 0, size: 100, sort: []}, signal);
        await sql.release(handle);
        const unchanged = before === JSON.stringify(session.document);
        session.updateAnalysis(id, {code: 'x$exakter_betrag[1] <- "kaputt"; other <- list(1L)'});
        await r.run(id);
        const errors = [];
        for (const name of ['x', 'other']) {
          try {
            await r.planExport(
              r.objectList.find((o) => o.ref.name === name)!.ref,
              'parquet',
              signal,
            );
          } catch (e) {
            errors.push(String(e));
          }
        }
        return {
          original,
          returned,
          types: preview.schema.columns.map((c) => c.logicalType),
          unchanged,
          errors,
        };
      } finally {
        await service.close();
      }
    },
    {raw: config, query},
  );
  expect(proof.returned.rows).toEqual(proof.original.rows);
  expect(proof.types).toContain('BIGINT');
  expect(proof.types).toContain('DECIMAL(18,4)');
  expect(proof.types).toContain('DATE');
  expect(proof.unchanged).toBe(true);
  expect(proof.errors).toHaveLength(2);
  expect(proof.errors[0]).toContain('DECIMAL');
  expect(proof.errors[1]).toContain('kein Dataframe');
});

test('R direct exports: hard row/byte limits and foreign session/scope reject before export', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const proof = await page.evaluate(async (raw) => {
    const path = '/tests/spike/sqlHarness.ts';
    const {sqlHarness} = (await import(path)) as typeof import('../spike/sqlHarness');
    const {service, session} = await sqlHarness(30000, undefined, {
      ...raw,
      limits: {...raw.limits, rHardRows: 3, transferBytes: 2048},
    } as unknown as import('../../contracts/runtime-config').RuntimeConfig);
    const signal = new AbortController().signal,
      errors: string[] = [];
    try {
      const id = session.createAnalysis('r');
      session.updateAnalysis(id, {
        code: 'rows <- data.frame(a=1:4); bytes <- data.frame(s=rep(strrep("x",8192L),2)); valid <- data.frame(a=1L)',
      });
      const r = session.getR();
      await r.run(id);
      for (const name of ['rows', 'bytes']) {
        try {
          await r.planExport(r.objectList.find((o) => o.ref.name === name)!.ref, 'csv', signal);
        } catch (e) {
          errors.push(JSON.stringify(e));
        }
      }
      const ref = r.objectList.find((o) => o.ref.name === 'valid')!.ref;
      try {
        await r.planExport(
          {...ref, scope: {...ref.scope, sessionId: crypto.randomUUID()}},
          'csv',
          signal,
        );
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      const plan = await r.planExport(ref, 'csv', signal);
      const other = session.createAnalysis('r');
      session.updateAnalysis(other, {
        environmentMode: 'fresh-environment',
        code: 'valid <- data.frame(a=7L)',
      });
      await r.run(other);
      try {
        await r.exportTable(plan.id, [], signal);
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      try {
        await r.planExport(ref, 'csv', signal);
      } catch (e) {
        errors.push(JSON.stringify(e));
      }
      return errors;
    } finally {
      await service.close();
    }
  }, config);
  expect(proof).toHaveLength(5);
  for (const error of proof.slice(0, 2)) expect(error).toContain('LIMIT_EXCEEDED');
  for (const error of proof.slice(2)) expect(error).toContain('RUNTIME_RESET');
});

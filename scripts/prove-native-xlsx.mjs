// Reproduces DuckDB v1.5.4 / duckdb-excel#92 using real, hash-pinned WASM.
// Requires the local Vite server; does not modify source, project storage or vendor assets.
import {chromium} from '@playwright/test';
import {createHash} from 'node:crypto';

const hashes = {
  wasm_eh: '7cba33e0c37b02640c16e390d1f47bbe46570ea261bdc2ce735ac52f1cff3505',
  wasm_mvp: 'b8f83c3ad78febf6d220e8628ea21d76e77e046cc9a5bfe02a6deec3ccdb688c',
};
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage();
  await page.route('**/excel.duckdb_extension.wasm', async (route) => {
    const platform = route.request().url().includes('wasm_eh') ? 'wasm_eh' : 'wasm_mvp';
    const response = await fetch(
      `https://extensions.duckdb.org/v1.5.4/${platform}/excel.duckdb_extension.wasm`,
    );
    if (!response.ok) throw new Error(`Excel proof asset: HTTP ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    const hash = createHash('sha256').update(body).digest('hex');
    if (hash !== hashes[platform]) throw new Error(`Excel proof checksum mismatch: ${platform}`);
    await route.fulfill({status: 200, contentType: 'application/wasm', body});
  });
  await page.goto('http://127.0.0.1:4173/tests/spike/index.html');
  const proof = await page.evaluate(async () => {
    const path = '/src/infrastructure/sqlrooms/runtime.ts';
    const {DuckDbRuntime} = await import(path);
    const runtime = new DuckDbRuntime();
    try {
      return await runtime.operation(new AbortController().signal, async (room, connection) => {
        await connection.query('INSTALL excel; LOAD excel');
        await connection.query(
          'CREATE TEMP TABLE probe AS SELECT CASE WHEN i=5 THEN NULL ELSE (i+0.5)::DOUBLE END AS v FROM range(10000) r(i)',
        );
        const result = [];
        for (const [name, projection] of [
          ['native', 'v'],
          ['text', 'v::VARCHAR AS v'],
        ]) {
          const file = `${name}.xlsx`;
          try {
            await connection.query(
              `COPY (SELECT ${projection} FROM probe) TO '${file}' (FORMAT XLSX, HEADER true, SHEET 'Daten')`,
            );
            await room.connector.getDb().flushFiles();
            result.push({
              name,
              ...(
                await connection.query(
                  `SELECT (SELECT count(v) FROM probe)::VARCHAR AS expected, count(v)::VARCHAR AS actual, count(*)::VARCHAR AS rows FROM read_xlsx('${file}',all_varchar=true,stop_at_empty=false)`,
                )
              )
                .get(0)
                .toJSON(),
            });
          } finally {
            await room.connector.getDb().dropFile(file);
          }
        }
        return result;
      });
    } finally {
      await runtime.dispose();
    }
  });
  console.log(JSON.stringify({engine: 'v1.5.4', hashes, proof}, null, 2));
  if (
    proof[0]?.expected !== '9999' ||
    proof[0]?.actual !== '9995' ||
    proof[0]?.rows !== '10000' ||
    proof[1]?.actual !== '9999'
  )
    throw new Error('The recorded native XLSX defect did not reproduce; review ADR-010.');
} finally {
  await browser.close();
}

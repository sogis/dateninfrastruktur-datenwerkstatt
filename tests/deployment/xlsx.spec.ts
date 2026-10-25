import {keepSqlResult, expectSqlKeepDisabled} from '../ui/sqlActions';
import {readFile} from 'node:fs/promises';
import {strFromU8, unzipSync} from 'fflate';
import type {Download, Page, TestInfo} from '@playwright/test';
import {test, expect} from './fixture';
import {inspectXlsxXml} from '../xlsx';

async function code(page: Page, value: string) {
  await page.locator('.monaco-editor').click();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await editor.press('ControlOrMeta+s');
}

async function inspectDownload(page: Page, download: Download) {
  expect(await download.failure()).toBeNull();
  const files = unzipSync(await readFile((await download.path())!));
  const xml = Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => path.endsWith('.xml') || path.endsWith('.rels'))
      .map(([path, bytes]) => [path, strFromU8(bytes)]),
  );
  return page.evaluate(inspectXlsxXml, xml);
}

async function exportXlsx(page: Page) {
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeEnabled();
  await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('menuitem', {name: 'XLSX exportieren', exact: true}).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const workbook = await inspectDownload(page, download);
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeEnabled();
  return workbook;
}

async function monitorStaticExport(page: Page, baseURL: string) {
  const network: string[] = [],
    errors: string[] = [],
    workers: {url: string; closed: boolean}[] = [];
  await page.addInitScript(() => {
    Reflect.set(globalThis, 'xlsxCspViolations', []);
    document.addEventListener('securitypolicyviolation', (event) => {
      (Reflect.get(globalThis, 'xlsxCspViolations') as string[]).push(
        `${event.effectiveDirective}: ${event.blockedURI}`,
      );
    });
  });
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) network.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => {
    const record = {url: worker.url(), closed: false};
    workers.push(record);
    worker.on('close', () => {
      record.closed = true;
    });
  });
  return {
    xlsxWorkers: () => workers.filter((worker) => /xlsx\.worker/i.test(worker.url)),
    verify: async (info: TestInfo) => {
      expect(await page.evaluate(() => Reflect.get(globalThis, 'xlsxCspViolations'))).toEqual([]);
      expect(errors).toEqual([]);
      expect(network.filter((url) => !url.startsWith(baseURL))).toEqual([]);
      expect(
        workers.filter((worker) => {
          const url = new URL(worker.url);
          return (
            !worker.url.startsWith(baseURL) &&
            !(url.protocol === 'blob:' && url.origin === new URL(baseURL).origin)
          );
        }),
      ).toEqual([]);
      const xlsxWorkers = workers.filter((worker) => /xlsx\.worker/i.test(worker.url));
      expect(xlsxWorkers.length).toBeGreaterThan(0);
      expect(xlsxWorkers.every((worker) => worker.url.startsWith(baseURL))).toBe(true);
      await expect
        .poll(() => workers.filter((worker) => /xlsx\.worker/i.test(worker.url) && !worker.closed))
        .toEqual([]);
      await info.attach('xlsx-static-network-and-workers', {
        body: JSON.stringify({network, workers}, null, 2),
        contentType: 'application/json',
      });
    },
  };
}

async function documentText(page: Page) {
  const id = /\/projects\/([^/]+)/.exec(new URL(page.url()).pathname)?.[1];
  if (!id) throw new Error('Projekt-ID fehlt.');
  return page.evaluate(
    (workspaceId) =>
      new Promise<string>((resolve, reject) => {
        const open = indexedDB.open('datenwerkstatt-v1');
        open.onupgradeneeded = () => {
          open.transaction?.abort();
          reject(new Error('Persistente Projektdatenbank fehlt.'));
        };
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const request = database
            .transaction('workspaces', 'readonly')
            .objectStore('workspaces')
            .get(workspaceId);
          request.onerror = () => {
            database.close();
            reject(request.error);
          };
          request.onsuccess = () => {
            database.close();
            const row: unknown = request.result;
            if (row === null || typeof row !== 'object' || !('document' in row)) {
              reject(new Error('Persistentes Projektdokument fehlt.'));
              return;
            }
            resolve(JSON.stringify(row.document));
          };
        };
      }),
    id,
  );
}

test('XLSX static SQL: full frozen result, kept reload, lazy local worker and CSV primary', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw new Error('Deployment-URL fehlt.');
  const audit = await monitorStaticExport(page, baseURL);
  await page.goto(`${baseURL}projects`);
  await page.getByLabel('Name des neuen Projekts').fill('Statischer XLSX SQL-Export');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await code(
    page,
    "SELECT i::INTEGER AS id, CASE WHEN i=348 THEN NULL ELSE '001' END AS text, random() AS zufall FROM range(350) t(i) ORDER BY i DESC",
  );
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  await expect(page.locator('.export-note')).toContainText('XLSX:');
  expect(audit.xlsxWorkers()).toEqual([]);
  const original = await exportXlsx(page);
  expect(original.sheet).toBe('Daten');
  expect(original.rows).toHaveLength(351);
  expect(original.rows[0]).toEqual(['id', 'text', 'zufall']);
  expect(original.rows[1]!.slice(0, 2)).toEqual([349, '001']);
  expect(original.rows[2]!.slice(0, 2)).toEqual([348, null]);
  expect(original.rows.at(-1)!.slice(0, 2)).toEqual([0, '001']);
  expect(original.formulas).toBe(0);
  expect(original.rows[0]).not.toContain('__dw_ordinal');
  await audit.verify(info);
  await keepSqlResult(page);
  await expectSqlKeepDisabled(page);
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page.reload();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  const reopened = await exportXlsx(page);
  expect(reopened.rows).toEqual(original.rows);
  const csvPending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'CSV exportieren', exact: true}).click();
  const csv = await csvPending;
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);
  expect((await readFile((await csv.path())!, 'utf8')).trimEnd().split('\n')).toHaveLength(351);
  await audit.verify(info);
});

test('XLSX static R: complete checked dataframe, literal strings and unchanged project document', async ({
  page,
  baseURL,
}, info) => {
  if (!baseURL) throw new Error('Deployment-URL fehlt.');
  const audit = await monitorStaticExport(page, baseURL);
  await page.goto(`${baseURL}projects`);
  await page.getByLabel('Name des neuen Projekts').fill('Statischer XLSX R-Export');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neues R-Skript', exact: true}).click();
  await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 90000});
  await code(
    page,
    'x <- data.frame(id=seq_len(350L), text=rep("001",350L), formula=rep("=1+1",350L)); cat("XLSX bereit")',
  );
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.getByRole('log')).toContainText('XLSX bereit');
  await page.getByRole('button', {name: 'x 350 Zeilen, 3 Spalten', exact: true}).click();
  await expect(page.locator('.r-output tbody tr')).toHaveCount(200);
  await expect(page.locator('.export-note')).toContainText('XLSX:');
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  const before = await documentText(page);
  expect(audit.xlsxWorkers()).toEqual([]);
  const workbook = await exportXlsx(page);
  expect(workbook.sheet).toBe('Daten');
  expect(workbook.rows).toHaveLength(351);
  expect(workbook.rows[0]).toEqual(['id', 'text', 'formula']);
  expect(workbook.rows[1]).toEqual([1, '001', '=1+1']);
  expect(workbook.rows.at(-1)).toEqual([350, '001', '=1+1']);
  expect(workbook.formulas).toBe(0);
  expect(await documentText(page)).toBe(before);
  await audit.verify(info);
});

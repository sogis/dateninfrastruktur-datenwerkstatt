import {expect, test} from '../persistentBrowser';
import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function createAnalysis(page: Page, language: 'sql' | 'r', code: string) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill(`XLSX ${language}`);
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page
    .getByRole('menuitem', {
      name: language === 'sql' ? 'Neue SQL-Abfrage' : 'Neues R-Skript',
      exact: true,
    })
    .click();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
  await editor.press('ControlOrMeta+s');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
}

async function inspectDownload(page: Page, language: 'sql' | 'r') {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
  await page.getByRole('menuitem', {name: 'XLSX exportieren', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'XLSX exportieren', exact: true});
  if (language === 'sql') {
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('DECIMAL');
    await dialog.getByRole('button', {name: 'Herunterladen', exact: true}).click();
  }
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const bytes = await readFile((await download.path())!);
  return page.evaluate(async (data) => {
    const path = '/tests/xlsx.ts';
    const {inspectXlsx} = (await import(path)) as typeof import('../xlsx');
    return inspectXlsx(new Uint8Array(data));
  }, Array.from(bytes));
}

test('XLSX SQL UI: downloads all result rows after paging and keeps CSV as primary action', async ({
  page,
}) => {
  await createAnalysis(
    page,
    'sql',
    'SELECT i::INTEGER AS id, random() AS random_value FROM range(350) t(i) ORDER BY i DESC',
  );
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  const firstRandom = await page
    .locator('.result-grid tbody tr')
    .first()
    .locator('td')
    .nth(1)
    .innerText();
  await page.getByRole('button', {name: 'Nächste Seite', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr').first().locator('td').first()).toHaveText(
    '249',
  );
  const book = await inspectDownload(page, 'sql');
  expect(book.rows).toHaveLength(351);
  expect(book.rows[0]).toEqual(['id', 'random_value']);
  expect(book.rows[1]![0]).toBe(349);
  expect(String(book.rows[1]![1])).toBe(firstRandom);
  expect(book.rows.at(-1)![0]).toBe(0);
  expect(book.formulas).toBe(0);
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'CSV exportieren', exact: true}).click();
  await page
    .getByRole('dialog', {name: 'CSV exportieren', exact: true})
    .getByRole('button', {name: 'Herunterladen', exact: true})
    .click();
  const csv = await pending;
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);
  expect((await readFile((await csv.path())!, 'utf8')).trimEnd().split('\n')).toHaveLength(351);
});

test('XLSX R UI: downloads the complete dataframe without changing its project', async ({page}) => {
  await createAnalysis(page, 'r', 'x <- data.frame(id=seq_len(350L), text=rep("001",350L))');
  await page.getByRole('button', {name: 'x 350 Zeilen, 2 Spalten', exact: true}).click();
  await expect(page.locator('.r-output tbody tr')).toHaveCount(200);
  const documentText = () =>
    page.evaluate(async () => {
      const path = '/tests/spike/appServices.ts';
      const {services} = (await import(path)) as typeof import('../spike/appServices');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      await session.flush();
      return JSON.stringify(session.document);
    });
  const before = await documentText();
  const book = await inspectDownload(page, 'r');
  expect(book.rows).toHaveLength(351);
  expect(book.rows[0]).toEqual(['id', 'text']);
  expect(book.rows[1]).toEqual([1, '001']);
  expect(book.rows.at(-1)).toEqual([350, '001']);
  expect(await documentText()).toBe(before);
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'CSV exportieren', exact: true}).click();
  const csv = await pending;
  expect(csv.suggestedFilename()).toBe('x.csv');
  expect((await readFile((await csv.path())!, 'utf8')).trimEnd().split('\n')).toHaveLength(351);
  expect(await documentText()).toBe(before);
});

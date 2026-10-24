import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';

async function replaceCode(page: Page, code: string) {
  await page.locator('.monaco-editor').click();
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Escape');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
}

test('SQL completion uses imported project tables and accepts columns without executing a query', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('SQL Vorschläge');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles({
      name: 'zahlen.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('wert;mit Abstand\n1;Text\n'),
    });
  await page.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await page.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();

  // Typing triggers suggestions; Ctrl+Space also supports explicit completion.
  await replaceCode(page, 'SELECT * FROM data.');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Control+Space');
  const suggestions = page.locator('.suggest-widget.visible');
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText('zahlen');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Enter');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT * FROM data.zahlen');

  await replaceCode(page, 'SELECT data.zahlen.');
  await page.keyboard.type('we');
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText('wert');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Enter');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT data.zahlen.wert');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Escape');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+z');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT data.zahlen.we');
  await replaceCode(page, 'SELECT data.zahlen.');
  await page.keyboard.type('"mit');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Control+Space');
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText('mit Abstand');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('Enter');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT data.zahlen."mit Abstand"');
  const currentCode = await page.evaluate(async () => {
    const path = '/src/infrastructure/monaco/runtime.ts';
    const {monaco} = (await import(
      path
    )) as typeof import('../../src/infrastructure/monaco/runtime');
    return monaco.editor.getEditors()[0]!.getValue();
  });
  expect(currentCode).toBe('SELECT data.zahlen."mit Abstand"');
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+s');
  const runCount = await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    await session.flush();
    return Object.keys(session.document.runs).length;
  });
  expect(runCount).toBe(0);
  expect(errors).toEqual([]);
});

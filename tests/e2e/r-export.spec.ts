import {test, expect} from '../persistentBrowser';
import {readFile} from 'node:fs/promises';

test('R direct export UI: full downloads from preview, stable CSV default and unchanged project', async ({
  page,
}) => {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('R Dateiexport');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neues R-Skript', exact: true}).click();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText('x <- data.frame(id=seq_len(350L), text=rep("001",350L))');
  await editor.press('ControlOrMeta+s');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
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
  const downloads = [];
  for (const format of ['csv', 'parquet', 'csv']) {
    const pending = page.waitForEvent('download');
    if (format === 'parquet') {
      await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
      await page.getByRole('menuitem', {name: 'Parquet exportieren', exact: true}).click();
    } else await page.getByRole('button', {name: 'CSV exportieren', exact: true}).click();
    const download = await pending;
    const bytes = await readFile((await download.path())!);
    downloads.push(download.suggestedFilename());
    if (format === 'csv') {
      expect(bytes.toString().trimEnd().split('\n')).toHaveLength(351);
      expect(bytes.toString()).toContain('"001"');
    } else expect(bytes.subarray(0, 4).toString()).toBe('PAR1');
    await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeEnabled();
  }
  expect(downloads).toEqual(['x.csv', 'x.parquet', 'x.csv']);
  expect(await documentText()).toBe(before);
  await page.locator('.monaco-editor').click();
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText('x <- data.frame(f=factor("b",levels=c("a","b","unused")))');
  await editor.press('ControlOrMeta+s');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await page.getByRole('button', {name: 'x 1 Zeile, 1 Spalte', exact: true}).click();
  const factorBefore = await documentText();
  await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Parquet exportieren', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'R-Tabelle exportieren'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name: 'PARQUET exportieren', exact: true}).click();
  const approval = dialog.getByRole('checkbox', {name: /Faktorwerte werden als Text/});
  await expect(approval).toHaveAttribute('aria-invalid', 'true');
  await approval.check();
  const factorDownload = page.waitForEvent('download');
  await dialog.getByRole('button', {name: 'PARQUET exportieren', exact: true}).click();
  await factorDownload;
  await expect(dialog).toHaveCount(0);
  expect(await documentText()).toBe(factorBefore);
});

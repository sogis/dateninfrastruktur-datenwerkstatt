import {expectSqlKeepDisabled} from '../ui/sqlActions';
import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';
async function code(page: Page, value: string) {
  const input = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await input.press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await input.press('ControlOrMeta+s');
}
test('P5 AT-040 AT-042 AT-046 AT-048: complete UI transfer, lazy worker survives routes, capture, reset and cancel', async ({
  page,
}) => {
  const workers: {url: string; closed: boolean}[] = [];
  page.on('worker', (worker) => {
    const record = {url: worker.url(), closed: false};
    workers.push(record);
    worker.on('close', () => {
      record.closed = true;
    });
  });
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('R Rundlauf');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  const sqlUrl = page.url();
  await code(page, 'SELECT i::INTEGER AS id FROM range(350) t(i)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  expect(workers.filter((w) => w.url.includes('webr'))).toHaveLength(0);
  await page.getByRole('button', {name: 'Nach R übernehmen', exact: true}).click();
  await page.getByRole('button', {name: 'Transfer prüfen', exact: true}).click();
  await expect(
    page
      .locator('.dw-dialog .dw-meta-list')
      .filter({hasText: /Zeilen\s*350\s*Geschätzte Datengrösse\s*[\d’'\s]+ Bytes/}),
  ).toBeVisible({timeout: 60000});
  await page
    .getByRole('dialog', {name: 'Resultat nach R übernehmen', exact: true})
    .getByRole('button', {name: 'Nach R übernehmen', exact: true})
    .click();
  await expect(page.locator('.r-workbench')).toBeVisible();
  const rUrl = page.url();
  await expect(page.getByRole('button', {name: /daten 350 Zeilen, 1 Spalte/})).toBeEnabled();
  await expect(page.locator('.run-status')).toContainText('Bereit');
  await code(
    page,
    'stopifnot(nrow(daten)==350L); vergleich <- data.frame(n=nrow(daten)); x <- 17; plot(1:4); cat("vollständig")',
  );
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.r-plot img')).toBeVisible();
  await expect(page.getByRole('log')).toContainText('vollständig');
  await page.getByRole('button', {name: 'Grafik aufbewahren', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Grafik aufbewahren', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: /vergleich 1 Zeile, 1 Spalte/}).click();
  await page.getByRole('button', {name: 'Objekt als Datensatz', exact: true}).click();
  await page.getByRole('button', {name: 'Datensatz übernehmen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByText('Datenstände und Herkunft (1)', {exact: true}).click();
  await expect(page.locator('.dataset-history')).toContainText(
    'R-Objektübernahme ohne gespeicherte Analyse',
  );
  await expect(page.locator('.dataset-history')).toContainText('Ergebnis „vergleich“');
  // Internal navigation preserves the WorkspaceSession and its live R objects.
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.locator(`a[href="${new URL(sqlUrl).pathname}"]`).click();
  await expect(page.locator('.result-footer')).toContainText('350 Zeilen');
  await expectSqlKeepDisabled(page);
  await code(page, 'SELECT n FROM vergleich');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText(['350']);
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.locator(`a[href="${new URL(rUrl).pathname}"]`).click();
  await expect(page.getByRole('button', {name: /x Klasse: numeric/})).toBeVisible();
  expect(workers.filter((w) => w.url.includes('webr'))).toHaveLength(1);
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'R zurücksetzen', exact: true}).click();
  await page.getByRole('button', {name: 'Reset bestätigen', exact: true}).click();
  await expect.poll(() => workers.filter((w) => w.url.includes('webr') && w.closed).length).toBe(1);
  await expect(page.getByRole('button', {name: /x Klasse: numeric/})).toHaveCount(0);
  await code(page, 'repeat { 1+1 }');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.run-status')).toContainText('R ausführen', {timeout: 60000});
  // Running snapshot appears only after initialization and before evaluating the loop.
  await expect(
    page.locator('.run-status option').filter({hasText: 'Ausführung läuft'}),
  ).toHaveCount(1, {
    timeout: 60000,
  });
  await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  await expect(page.getByRole('alert').filter({hasText: 'CANCELLED'})).toBeVisible();
  await expect.poll(() => workers.filter((w) => w.url.includes('webr') && w.closed).length).toBe(2);
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.locator(`a[href="${new URL(sqlUrl).pathname}"]`).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText(['350']);
});

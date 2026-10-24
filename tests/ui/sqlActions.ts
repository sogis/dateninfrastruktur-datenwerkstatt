import {expect, type Page} from '@playwright/test';

export async function openSqlParameters(page: Page) {
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  await page.getByRole('menuitem', {name: /^Parameter \(/}).click();
}
export async function openAnalysisRename(page: Page) {
  const analysisId = new URL(page.url()).pathname.split('/').at(-1)!;
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  const link = page.locator(`.analysis-list a[href$="/${analysisId}"]`);
  const row = link.locator('..');
  await row.getByRole('button').click();
  await page.getByRole('menuitem', {name: 'Umbenennen', exact: true}).click();
  return link;
}
export async function renameAnalysis(page: Page, value: string) {
  const link = await openAnalysisRename(page);
  await page.getByRole('dialog').getByLabel('Analysename', {exact: true}).fill(value);
  await page.getByRole('dialog').getByRole('button', {name: 'Umbenennen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await link.click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
}
export async function resetAnalysisLayout(page: Page) {
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen', exact: true}).click();
}
export async function showKeptSqlResult(page: Page, newestFirstIndex: number) {
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Aufbewahrte Ergebnisse', exact: true}).click();
  await page
    .getByRole('dialog', {name: 'Aufbewahrte Ergebnisse', exact: true})
    .locator('.sql-version-list li')
    .nth(newestFirstIndex)
    .getByRole('button', {name: 'Ergebnis anzeigen', exact: true})
    .click();
}

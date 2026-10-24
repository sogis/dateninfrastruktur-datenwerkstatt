import type {Locator, Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {test, expect} from '../persistentBrowser';

async function openImport(page: Page, csv = 'id;wert\n001;10\n') {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Verständlicher CSV-Import');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Datei importieren', exact: true});
  await dialog.getByLabel('Datei (CSV oder Parquet, maximal 128 MiB)').setInputFiles({
    name: 'verstaendlich.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  return dialog;
}

function advanced(dialog: Locator) {
  const summary = dialog.locator('summary').filter({hasText: 'Erweiterte Optionen'});
  return {summary, details: summary.locator('..')};
}

async function refresh(dialog: Locator) {
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(dialog.getByRole('button', {name: 'Import bestätigen', exact: true})).toBeEnabled();
}

test('REQ-025: basic options explain symbols, Value Delimiter and adaptive examples', async ({
  page,
}) => {
  const dialog = await openImport(page, `id;wert\n${'001;10\n'.repeat(200)}`);
  const delimiter = dialog.getByLabel('Spaltentrennzeichen', {exact: true});
  await expect(delimiter.locator('option')).toHaveText([
    'Semikolon (;)',
    'Komma (,)',
    'Tabulator',
    'Senkrechter Strich (|)',
  ]);
  await expect(delimiter).toHaveAccessibleDescription(/Ort;Einwohner/);
  const quote = dialog.getByLabel('Textbegrenzungszeichen', {exact: true});
  await expect(quote.locator('option')).toHaveText([
    'Doppelte Anführungszeichen (")',
    "Einfache Anführungszeichen (')",
    'Keine',
  ]);
  await expect(quote).toHaveAccessibleDescription(/Auch Value Delimiter genannt\./);
  await expect(quote).toHaveAccessibleDescription(/"Basel; Nord"/);
  await quote.selectOption({label: "Einfache Anführungszeichen (')"});
  await expect(quote).toHaveAccessibleDescription(/'Basel; Nord'/);
  await delimiter.selectOption(',');
  await expect(quote).toHaveAccessibleDescription(/'Basel, Nord'/);
  await quote.selectOption({label: 'Keine'});
  await expect(quote).toHaveAccessibleDescription(/gewöhnlich|normaler Text/);
  await expect(dialog.getByLabel('Dezimalzeichen', {exact: true}).locator('option')).toHaveText([
    'Punkt (1234.56)',
    'Komma (1234,56)',
  ]);
  await expect(dialog.getByLabel('Erste Zeile enthält Spaltennamen', {exact: true})).toBeChecked();
  await expect(dialog.getByLabel('Originaldatei zusätzlich behalten', {exact: true})).toBeVisible();
  await expect(
    dialog.getByLabel('Originaldatei zusätzlich behalten', {exact: true}),
  ).toHaveAccessibleDescription(/CSV.*zusätzlich.*Tabelle|Quelldatei/);
  await expect(
    dialog.getByLabel('Originaldatei zusätzlich behalten', {exact: true}),
  ).toHaveAccessibleDescription(/KiB|MiB/);
  await expect(advanced(dialog).details).not.toHaveAttribute('open');
});

test('REQ-025: keyboard toggles advanced options without changing settings and summary retains active deviations', async ({
  page,
}) => {
  const dialog = await openImport(page);
  const {summary, details} = advanced(dialog);
  const empty = dialog.getByLabel('Leere Felder als fehlende Werte (NULL) importieren', {
    exact: true,
  });
  const marker = dialog.getByLabel('Text für fehlende Werte');
  await summary.focus();
  await summary.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(empty).toBeChecked();
  await expect(marker).toHaveValue('');
  await expect(empty).toHaveAccessibleDescription(/leere[rn]? Text|leerer Text/);
  await expect(marker).toHaveAccessibleDescription(/NA/);
  await expect(marker).toHaveAccessibleDescription(/Ohne Eintrag.*Text/);
  await expect(details).toContainText('UTF-8');
  await empty.uncheck();
  await marker.fill('NA');
  await summary.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toContainText('NA');
  await expect(summary).toContainText(/leer/i);
  await summary.press('Enter');
  await expect(empty).not.toBeChecked();
  await expect(marker).toHaveValue('NA');
  await empty.check();
  await marker.fill('');
  await summary.press('Space');
  await expect(summary).toHaveText('Erweiterte Optionen');
});

test('REQ-025: changed parser options require a fresh preview and text delimiters reset inferred columns', async ({
  page,
}) => {
  const dialog = await openImport(page);
  const confirm = dialog.getByRole('button', {name: 'Import bestätigen', exact: true});
  const quote = dialog.getByLabel('Textbegrenzungszeichen', {exact: true});
  await refresh(dialog);
  await dialog.getByLabel('Spalte 1', {exact: true}).fill('umbenannt');
  await refresh(dialog);
  await expect(dialog.getByRole('columnheader', {name: /^umbenannt/})).toBeVisible();
  await quote.selectOption({label: "Einfache Anführungszeichen (')"});
  await expect(confirm).toBeDisabled();
  await expect(dialog.getByLabel('Spalte 1', {exact: true})).toHaveCount(0);
  await refresh(dialog);
  await expect(dialog.getByLabel('Spalte 1', {exact: true})).toHaveValue('id');
  await quote.selectOption({label: 'Keine'});
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await dialog.getByLabel('Spaltentrennzeichen', {exact: true}).selectOption(',');
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await dialog.getByLabel('Spaltentrennzeichen', {exact: true}).selectOption(';');
  await refresh(dialog);
  await dialog.getByLabel('Dezimalzeichen', {exact: true}).selectOption(',');
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await dialog.getByLabel('Erste Zeile enthält Spaltennamen', {exact: true}).uncheck();
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await advanced(dialog).summary.click();
  await dialog.getByLabel('Leere Felder als fehlende Werte (NULL) importieren').uncheck();
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await dialog.getByLabel('Text für fehlende Werte').fill('NA');
  await expect(confirm).toBeDisabled();
  await refresh(dialog);
  await advanced(dialog).summary.click();
  await expect(confirm).toBeEnabled();
  await dialog.getByLabel('Originaldatei zusätzlich behalten', {exact: true}).uncheck();
  await expect(confirm).toBeEnabled();
});

test('REQ-025: imported single quote choices appear in provenance and remain after reload', async ({
  page,
}) => {
  const dialog = await openImport(page, "id;text;marker\n001;'Basel; Nord';'NA'\n002;'';NA\n");
  await dialog
    .getByLabel('Textbegrenzungszeichen', {exact: true})
    .selectOption({label: "Einfache Anführungszeichen (')"});
  await advanced(dialog).summary.click();
  await dialog.getByLabel('Text für fehlende Werte').fill('NA');
  await refresh(dialog);
  await dialog.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', {name: 'Daten ansehen', exact: true}).click();
  await expect(page.getByRole('cell', {name: 'Basel; Nord', exact: true})).toBeVisible();
  await expect(page.getByRole('cell', {name: 'NA', exact: true})).toBeVisible();
  await page.locator('.dataset-history > summary').click();
  const options = page.locator('.dataset-import-options');
  await options.locator('summary').click();
  const quoteTerm = options.locator('dt').filter({hasText: /^Textbegrenzungszeichen$/});
  await expect(quoteTerm.locator('xpath=following-sibling::dd[1]')).toHaveText(
    "Einfache Anführungszeichen (')",
  );
});

test('REQ-025 / AT-055: import options and dialog actions fit narrow and desktop widths and 200% text', async ({
  page,
  browserName,
}) => {
  const evidence = 'docs/verification/csv-import-options';
  await mkdir(evidence, {recursive: true});
  await page.setViewportSize({width: 1440, height: 900});
  const dialog = await openImport(page);
  await page.screenshot({path: `${evidence}/${browserName}-basis-1440.png`, fullPage: true});
  await advanced(dialog).summary.click();
  await dialog.getByLabel('Text für fehlende Werte').fill('NA');
  for (const width of [390, 1280, 1440]) {
    await page.setViewportSize({width, height: 900});
    await dialog.getByLabel('Textbegrenzungszeichen', {exact: true}).scrollIntoViewIfNeeded();
    await expect(dialog.getByLabel('Textbegrenzungszeichen', {exact: true})).toBeInViewport();
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const name of ['Vorschau laden', 'Import bestätigen', 'Schliessen']) {
      const button = dialog.getByRole('button', {name, exact: true});
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(40);
      expect(box?.height).toBeGreaterThanOrEqual(40);
    }
    await page.screenshot({path: `${evidence}/${browserName}-${width}.png`, fullPage: true});
  }
  await page.addStyleTag({content: 'html { font-size: 200%; }'});
  await page.setViewportSize({width: 390, height: 900});
  const preview = dialog.getByRole('button', {name: 'Vorschau laden', exact: true});
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toBeInViewport();
  await refresh(dialog);
  const confirm = dialog.getByRole('button', {name: 'Import bestätigen', exact: true});
  await confirm.scrollIntoViewIfNeeded();
  await expect(confirm).toBeInViewport();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({path: `${evidence}/${browserName}-390-text-200.png`, fullPage: true});
  const close = dialog.getByRole('button', {name: 'Schliessen', exact: true});
  await close.scrollIntoViewIfNeeded();
  await expect(close).toBeInViewport();
  await close.click();
  await expect(dialog).toHaveCount(0);
});

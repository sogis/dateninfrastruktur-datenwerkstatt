import {test, expect} from '../persistentBrowser';
import type {Locator, Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const evidence = 'docs/verification/neutral-v1.2';
async function capture(page: Page, name: string) {
  await mkdir(evidence, {recursive: true});
  await page.screenshot({path: `${evidence}/${name}.png`, fullPage: true});
}
async function bounds(control: Locator) {
  const rect = await control.boundingBox();
  if (!rect) throw Error('Control is not visible');
  return rect;
}
async function aligned(input: Locator, action: Locator) {
  const [field, button] = await Promise.all([bounds(input), bounds(action)]);
  expect(Math.abs(field.y - button.y)).toBeLessThan(0.5);
  expect(Math.abs(field.y + field.height - button.y - button.height)).toBeLessThan(0.5);
}

test('Neutral UI: real project navigation, aligned tables, optional fields and error layouts', async ({
  page,
}) => {
  test.setTimeout(30_000);
  await page.setViewportSize({width: 1280, height: 800});
  await page.goto('/projects');
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('header');
  await expect(header.getByRole('link', {name: 'Datenwerkstatt', exact: true})).toBeVisible();
  await expect(header.locator('img[alt="Kanton Solothurn"]')).toHaveCount(0);
  await expect(header.locator('.brand-placeholder')).toHaveAttribute('aria-hidden', 'true');
  expect((await bounds(header)).height).toBe(56);
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  await expect(nav).toHaveCSS('width', '52px');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  const name = page.getByLabel('Name des neuen Projekts', {exact: true});
  const create = page.getByRole('button', {name: 'Neues Projekt', exact: true});
  await expect(name).toHaveAttribute('required');
  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 800});
    await name.fill('');
    const before = await bounds(create);
    if (width === 1280) await aligned(name, create);
    await create.click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAccessibleDescription('Bitte gib einen Projektnamen ein.');
    const error = page.locator('.create-workspace .dw-field-error');
    if (width === 1280) await aligned(name, create);
    // Only the presentation probe is longer; application validation stays unchanged.
    await error.evaluate((node) => {
      node.textContent = `${node.textContent} Bitte wähle einen aussagekräftigen Projektnamen, damit du deine Auswertung später wiederfindest.`;
    });
    expect((await bounds(error)).height).toBeGreaterThan(28);
    if (width === 1280) {
      await aligned(name, create);
      expect((await bounds(create)).y).toBeCloseTo(before.y, 1);
    } else {
      const [field, button, message] = await Promise.all([
        bounds(name),
        bounds(create),
        bounds(error),
      ]);
      expect(button.x).toBeCloseTo(field.x, 1);
      expect(button.y).toBeGreaterThanOrEqual(message.y + message.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await capture(page, `project-error-${width}`);
    await name.fill('Neutrale Datenwerkstatt');
    await expect(error).toHaveCount(0);
  }
  await page.setViewportSize({width: 1280, height: 800});
  await create.click();
  await expect(
    page.getByRole('heading', {name: 'Neutrale Datenwerkstatt', exact: true}),
  ).toBeVisible();
  const projectUrl = page.url();
  const description = page.getByRole('textbox', {name: 'Beschreibung', exact: true});
  await expect(description).toHaveAccessibleDescription('(optional)');
  await expect(description).not.toHaveAttribute('required');
  await expect(page.locator('label[for="workspace-description"] .dw-field-optional')).toHaveCSS(
    'font-weight',
    '400',
  );
  await expect(page.locator('.dw-label').filter({hasText: '*'})).toHaveCount(0);
  await expect(page.getByText(/^\*?\s*Pflichtfeld$/)).toHaveCount(0);
  await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  await expect(nav).toHaveCSS('width', '212px');
  await nav.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await expect(nav.getByRole('link', {name: 'Einstellungen', exact: true})).toHaveAttribute(
    'aria-current',
    'page',
  );
  await capture(page, 'settings');
  await nav.getByRole('link', {name: 'Projekte', exact: true}).click();
  const table = page.locator('.workspace-list');
  const row = table.locator('tbody tr').filter({hasText: 'Neutrale Datenwerkstatt'});
  for (const index of [1, 2]) {
    const column = table.locator('thead th').nth(index);
    await expect(column).toHaveAttribute('scope', 'col');
    await expect(column).toHaveCSS('text-align', /right|end/);
    await expect(row.locator('td').nth(index)).toHaveCSS('text-align', /right|end/);
    await expect(row.locator('td').nth(index)).toHaveText('0');
    await expect(row.locator('td').nth(index)).toHaveCSS('font-variant-numeric', 'tabular-nums');
  }
  await expect(row.locator('td').first()).toHaveCSS('text-align', /left|start/);
  await expect(row.locator('td').last()).toHaveCSS('text-align', /left|start/);
  const compactTime = row.locator('time');
  await expect(compactTime).toHaveAttribute('datetime', /T/);
  await expect(compactTime).toHaveText(/\d{2}\.\d{2}\.\d{4}.*\d{2}:\d{2}$/);
  await expect(row.locator('details')).toHaveCount(0);
  await compactTime.hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(compactTime).toHaveAccessibleDescription(/\d{2}:\d{2}:\d{2}[.,]\d{3}/);
  await page.keyboard.press('Escape');
  await capture(page, 'projects-table');
  await row.getByRole('link', {name: 'Neutrale Datenwerkstatt', exact: true}).click();
  await nav.getByRole('link', {name: 'Daten', exact: true}).click();
  const importButton = page.getByRole('button', {name: 'Datei hinzufügen', exact: true});
  await importButton.click();
  await expect(page.getByRole('dialog', {name: 'Datei importieren'})).toBeVisible();
  await capture(page, 'import-dialog');
  await page.keyboard.press('Escape');
  await expect(importButton).toBeFocused();
  await nav.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await nav.getByRole('button', {name: 'Navigation einklappen', exact: true}).click();
  await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const analysisName = page.getByRole('textbox', {name: 'Analysename', exact: true});
  const save = page.getByRole('button', {name: 'Speichern', exact: true});
  const run = page.getByRole('button', {name: 'Ausführen', exact: true});
  await aligned(analysisName, save);
  await aligned(analysisName, run);
  await analysisName.fill('');
  await save.click();
  await expect(analysisName).toBeFocused();
  await expect(analysisName).toHaveAccessibleDescription('Bitte gib einen Analysenamen ein.');
  await aligned(analysisName, save);
  await aligned(analysisName, run);
  await capture(page, 'sql-name-error');
  await analysisName.fill('SQL-Auswertung');
  await analysisName.press('Tab');
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  const parameters = page.locator('.parameters');
  await parameters.locator('summary').click();
  await parameters.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  const value = parameters.getByRole('textbox', {name: 'Parameter 1 Wert', exact: true});
  const type = parameters.getByRole('combobox', {name: 'Parameter 1 Typ', exact: true});
  await expect(value).not.toHaveAttribute('required');
  await expect(value).toHaveAccessibleDescription('(optional)');
  await type.selectOption('number');
  await expect(value).toHaveAttribute('required');
  await expect(parameters.getByText('(optional)', {exact: true})).toHaveCount(0);
  await type.selectOption('null');
  await expect(value).toBeDisabled();
  await expect(value).not.toHaveAttribute('required');
  await expect(parameters.getByText('(optional)', {exact: true})).toHaveCount(0);
  await type.selectOption('string');
  await expect(value).toBeEnabled();
  await expect(parameters.getByText('(optional)', {exact: true})).toBeVisible();
  await capture(page, 'sql-parameters');
  expect(page.url()).toContain(`${projectUrl}/sql/`);
});

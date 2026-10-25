import {openAnalysisRename, openSqlParameters} from '../ui/sqlActions';
import {test, expect} from '../persistentBrowser';
import type {Locator, Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

test.setTimeout(15_000);

const evidence = 'docs/verification/sql-workbench/optional-labels';
async function capture(page: Page, name: string) {
  await mkdir(evidence, {recursive: true});
  await page.screenshot({path: `${evidence}/${name}.png`, fullPage: true});
}
async function box(control: Locator) {
  const bounds = await control.boundingBox();
  if (!bounds) throw Error('Control is not visible');
  return bounds;
}
async function aligned(input: Locator, button: Locator) {
  const [field, action] = await Promise.all([box(input), box(button)]);
  expect(Math.abs(field.y - action.y)).toBeLessThan(0.5);
  expect(Math.abs(field.y + field.height - action.y - action.height)).toBeLessThan(0.5);
}
async function noRequiredMarkers(page: Page) {
  await expect(page.locator('.dw-label').filter({hasText: '*'})).toHaveCount(0);
  await expect(page.getByText(/^\*?\s*Pflichtfeld$/)).toHaveCount(0);
}

test('Optional labels: project fields and error layout on desktop and narrow screens', async ({
  page,
}) => {
  await page.goto('/projects');
  await page.evaluate(() => document.fonts.ready);
  const name = page.getByLabel('Name des neuen Projekts', {exact: true});
  const create = page.getByRole('button', {name: 'Neues Projekt', exact: true});
  await expect(name).toHaveAttribute('required');
  await noRequiredMarkers(page);
  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 800});
    await name.fill('');
    const before = await box(create);
    if (width === 1280) await aligned(name, create);
    await create.click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAccessibleDescription('Bitte gib einen Projektnamen ein.');
    const error = page.locator('.create-workspace .dw-field-error');
    if (width === 1280) {
      await aligned(name, create);
      expect((await box(create)).y).toBeCloseTo(before.y, 1);
    }
    // Exercise wrapping in the real field-error region, without altering validation rules.
    await error.evaluate((node) => {
      node.textContent = `${node.textContent} Bitte wähle einen aussagekräftigen Projektnamen, damit du deine Auswertung später wiederfindest.`;
    });
    expect((await box(error)).height).toBeGreaterThan(28);
    if (width === 1280) {
      await aligned(name, create);
      expect((await box(create)).y).toBeCloseTo(before.y, 1);
    } else {
      const [field, action, message] = await Promise.all([box(name), box(create), box(error)]);
      expect(action.x).toBeCloseTo(field.x, 1);
      expect(action.y).toBeGreaterThanOrEqual(message.y + message.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await capture(page, `project-error-${width}`);
    await name.fill('Korrigierter Name');
    await expect(error).toHaveCount(0);
  }
  await page.setViewportSize({width: 1280, height: 800});
  await name.fill('  Ölten öffentlich  ');
  await create.click();
  await expect(page.getByRole('heading', {name: 'Ölten öffentlich', exact: true})).toBeVisible();
  const description = page.getByRole('textbox', {name: 'Beschreibung', exact: true});
  await expect(description).not.toHaveAttribute('required');
  await expect(description).toHaveAccessibleDescription('(optional)');
  const suffix = page.locator('label[for="workspace-description"] .dw-field-optional');
  await expect(suffix).toHaveText('(optional)');
  await expect(suffix).toHaveCSS('font-weight', '400');
  const styles = await suffix.evaluate((node) => ({
    color: getComputedStyle(node).color,
    labelColor: getComputedStyle(node.parentElement!).color,
    size: getComputedStyle(node).fontSize,
    labelSize: getComputedStyle(node.parentElement!).fontSize,
  }));
  expect(styles.color).not.toBe(styles.labelColor);
  expect(styles.size).toBe(styles.labelSize);
  await noRequiredMarkers(page);
  await capture(page, 'project-optional-description');
});

test('Optional labels: SQL toolbar alignment and conditional parameter values', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('Beschriftungen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const save = page.getByRole('button', {name: 'Speichern', exact: true});
  const run = page.getByRole('button', {name: 'Ausführen', exact: true});
  await expect(page.locator('.analysis-name-text')).toBeVisible();
  await aligned(save, run);
  const analysisLink = await openAnalysisRename(page);
  const name = page.getByRole('textbox', {name: 'Analysename', exact: true});
  await name.fill('');
  await page.getByRole('button', {name: 'Umbenennen', exact: true}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription('Bitte gib einen Analysenamen ein.');
  await capture(page, 'sql-name-error');
  await name.fill('SQL-Auswertung');
  await page.getByRole('button', {name: 'Umbenennen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await analysisLink.click();
  await openSqlParameters(page);
  const parameters = page.getByRole('dialog', {name: 'Parameter', exact: true});
  await parameters.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  const value = parameters.getByRole('textbox', {name: 'Parameter 1 Wert', exact: true});
  const type = parameters.getByRole('combobox', {name: 'Parameter 1 Typ', exact: true});
  const suffix = parameters.getByText('(optional)', {exact: true});
  await expect(value).not.toHaveAttribute('required');
  await expect(value).toHaveAccessibleDescription('(optional)');
  await expect(suffix).toBeVisible();
  await type.selectOption('number');
  await expect(value).toHaveAttribute('required');
  await expect(suffix).toHaveCount(0);
  await type.selectOption('null');
  await expect(value).toBeDisabled();
  await expect(value).not.toHaveAttribute('required');
  await expect(suffix).toHaveCount(0);
  await type.selectOption('string');
  await expect(value).toBeEnabled();
  await expect(suffix).toBeVisible();
  await noRequiredMarkers(page);
  await capture(page, 'sql-optional-parameter');
});

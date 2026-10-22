import {test, expect} from '../persistentBrowser';
import {mkdir} from 'node:fs/promises';

test('Project timestamp: full date tooltip on hover and keyboard focus without expanding the row', async ({
  page,
}) => {
  test.setTimeout(15_000);
  const instant = '2026-10-20T18:35:31.214Z';
  const compact = '20.10.2026, 18:35';
  const full = '20.10.2026, 18:35:31.214 UTC';
  await page.clock.setFixedTime(instant);
  await page.setViewportSize({width: 1280, height: 800});
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('Datumsanzeige');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Datumsanzeige', exact: true})).toBeVisible();
  await page
    .getByRole('navigation', {name: 'Hauptnavigation'})
    .getByRole('link', {name: 'Projekte', exact: true})
    .click();
  await page.evaluate(() => document.fonts.ready);

  const row = page.locator('.workspace-list tbody tr').filter({hasText: 'Datumsanzeige'});
  const timestamp = row.locator('time');
  const tooltip = page.getByRole('tooltip');
  await expect(timestamp).toHaveText(compact);
  await expect(timestamp).toHaveAttribute('datetime', instant);
  await expect(timestamp).toHaveAttribute('tabindex', '0');
  await expect(timestamp).not.toHaveAttribute('title');
  await expect(row.locator('button, details, summary')).toHaveCount(0);
  const before = (await row.boundingBox())!;
  await timestamp.hover();
  await expect(tooltip).toHaveText(full);
  await expect(tooltip).toBeVisible();
  await expect(timestamp).toHaveAccessibleDescription(full);
  expect((await row.boundingBox())!.height).toBe(before.height);
  await expect(timestamp).toHaveText(compact);
  const evidence = 'docs/verification/timestamp-tooltip';
  await mkdir(evidence, {recursive: true});
  await page.screenshot({path: `${evidence}/timestamp-tooltip.png`});

  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await row.getByRole('link', {name: 'Datumsanzeige', exact: true}).focus();
  await page.keyboard.press('Tab');
  await expect(timestamp).toBeFocused();
  await expect(timestamp).toHaveCSS('outline-width', '3px');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(full);
  await expect(timestamp).toHaveAccessibleDescription(full);
  expect((await row.boundingBox())!.height).toBe(before.height);
  await expect(timestamp).toHaveAttribute('datetime', instant);
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await expect(timestamp).toBeFocused();
});

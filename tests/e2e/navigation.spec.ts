import {test, expect} from '../persistentBrowser';
import type {Page, TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

test('Navigation: settings remain reachable on global pages, with session toggle and saved default', async ({
  page,
}) => {
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto('/workspaces');
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  const settings = nav.getByRole('link', {name: 'Einstellungen', exact: true});
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.locator('header').getByRole('link', {name: 'Einstellungen'})).toHaveCount(0);
  await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  await expect(nav.getByRole('link', {name: 'Arbeitsbereiche', exact: true})).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav).toHaveCSS('width', '52px');
  await expect(settings.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await settings.focus();
  await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
  await settings.press('Enter');
  await expect(page).toHaveURL(/\/settings$/);
  await expect(settings).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await nav.getByRole('button', {name: 'Navigation ausklappen'}).press('Enter');
  await expect(nav).toHaveCSS('width', '212px');
  await expect(settings.locator('span')).toHaveText('Einstellungen');
  await nav.getByRole('link', {name: 'Arbeitsbereiche', exact: true}).click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(nav).toHaveCSS('width', '212px');
  await page.goBack();
  await expect(settings).toHaveAttribute('aria-current', 'page');
  await page.goForward();
  await expect(nav.getByRole('link', {name: 'Arbeitsbereiche', exact: true})).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.goto('/settings');
  await expect(nav).toHaveCSS('width', '52px');
  await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  await expect(page.getByRole('status')).toHaveText('Einstellungen gespeichert');
  await page.reload();
  await expect(nav).toHaveCSS('width', '212px');
  await nav.getByRole('button', {name: 'Navigation einklappen'}).click();
  await nav.getByRole('link', {name: 'Arbeitsbereiche', exact: true}).click();
  await expect(nav).toHaveCSS('width', '52px');
  await page.reload();
  await expect(nav).toHaveCSS('width', '212px');
  expect(workers).toEqual([]);
});

test('Navigation: settings follow R and leaving the workspace saves edits and its sidebar view', async ({
  page,
}, info) => {
  await page.goto('/workspaces');
  await page.getByLabel('Name des neuen Arbeitsbereichs').fill('Navigation und Autosave');
  await page.getByRole('button', {name: 'Neuer Arbeitsbereich', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Navigation und Autosave'})).toBeVisible();
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  await expect(page.getByRole('navigation')).toHaveCount(1);
  expect(
    await nav
      .locator('.dw-nav-item')
      .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label'))),
  ).toEqual([
    'Navigation ausklappen',
    'Arbeitsbereiche',
    'Projektübersicht',
    'Daten',
    'SQL',
    'R',
    'Einstellungen',
  ]);
  await nav.getByRole('button', {name: 'Navigation ausklappen'}).click();
  await page.getByLabel('Beschreibung', {exact: true}).fill('Beim Wechsel zuverlässig gespeichert');
  await nav.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  await page.goBack();
  await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
    'Beim Wechsel zuverlässig gespeichert',
  );
  await expect(nav).toHaveCSS('width', '212px');
  await page.reload();
  await expect(nav).toHaveCSS('width', '212px');
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({path: info.outputPath(`navigation-${viewport.width}.png`)});
  }
});

async function noticeGeometry(page: Page, info: TestInfo, name: string) {
  const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  await expect(close).toBeVisible();
  await expect(close).toHaveText('');
  await expect(close.locator('svg')).toHaveAttribute('viewBox', '0 0 16 16');
  await expect(close.locator('svg')).toHaveAttribute('focusable', 'false');
  const geometry = await close.evaluate((button) => {
    const banner = button.closest('.app-error')!;
    const text = banner.querySelector('strong')!;
    const rect = banner.getBoundingClientRect();
    const control = button.getBoundingClientRect();
    const icon = button.querySelector('svg')!.getBoundingClientRect();
    const label = text.getBoundingClientRect();
    const style = getComputedStyle(button);
    return {
      banner: {top: rect.top, bottom: rect.bottom, right: rect.right},
      control: {top: control.top, bottom: control.bottom, left: control.left, right: control.right},
      iconCenter: (icon.top + icon.bottom) / 2,
      text: {
        right: label.right,
        height: label.height,
        lineHeight: getComputedStyle(text).lineHeight,
      },
      color: style.color,
      background: style.backgroundColor,
      border: style.borderColor,
      width: style.width,
      height: style.height,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(geometry.color).toBe('rgb(11, 95, 255)');
  expect(geometry.background).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.border).toBe('rgba(0, 0, 0, 0)');
  expect(geometry.width).toBe('40px');
  expect(geometry.height).toBe('40px');
  expect(
    Math.abs(geometry.iconCenter - (geometry.banner.top + geometry.banner.bottom) / 2),
  ).toBeLessThan(0.5);
  expect(geometry.control.left).toBeGreaterThan(geometry.text.right);
  expect(geometry.control.right).toBeLessThan(geometry.banner.right);
  expect(geometry.overflow).toBe(false);
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify(geometry, null, 2));
  await page.screenshot({path: info.outputPath(`${name}.png`)});
  return geometry;
}

test('Notices: real short and multiline errors have a centered blue SVG and keyboard dismissal', async ({
  page,
  browserName,
}, info) => {
  await page.goto('/workspaces');
  await page.getByLabel('Projektdatei importieren').setInputFiles({
    name: 'defekt.dwproj',
    mimeType: 'application/zip',
    buffer: Buffer.from('invalid'),
  });
  await expect(page.getByRole('alert')).toContainText('ARCHIVE_INVALID');
  const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(viewport);
    await noticeGeometry(page, info, `notice-short-${viewport.width}`);
  }
  await close.click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Name des neuen Arbeitsbereichs').fill('Hinweisprüfung');
  await page.getByRole('button', {name: 'Neuer Arbeitsbereich', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Hinweisprüfung'})).toBeVisible();
  await page.getByLabel('Projektname', {exact: true}).fill('');
  await page.getByLabel('Beschreibung', {exact: true}).focus();
  await expect(page.getByRole('alert')).toContainText('Too small');
  await noticeGeometry(page, info, 'notice-name-error');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  const zoomed = await noticeGeometry(page, info, 'notice-name-error-zoom-200');
  expect(zoomed.text.height).toBeGreaterThan(2 * Number.parseFloat(zoomed.text.lineHeight));
  await close.focus();
  const optionTab = browserName === 'webkit' && process.platform === 'darwin';
  await close.press(optionTab ? 'Alt+Tab' : 'Tab');
  await page.keyboard.press(optionTab ? 'Alt+Shift+Tab' : 'Shift+Tab');
  await expect(close).toBeFocused();
  await expect(page.getByRole('tooltip', {name: 'Hinweis schliessen', exact: true})).toBeVisible();
  await expect(close).toHaveCSS('outline-style', 'solid');
  await close.press('Enter');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

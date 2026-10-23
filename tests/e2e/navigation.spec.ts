import {test, expect} from '../persistentBrowser';
import type {Page, TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

test('Navigation: settings remain reachable on global pages, with session toggle and saved default', async ({
  page,
}) => {
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto('/projects');
  await expect(page.locator('.build-status')).toHaveCount(0);
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  const settings = nav.getByRole('link', {name: 'Einstellungen', exact: true});
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.locator('header').getByRole('link', {name: 'Einstellungen'})).toHaveCount(0);
  await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  await expect(nav.getByRole('link', {name: 'Projekte', exact: true})).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav).toHaveCSS('width', '52px');
  await expect(settings.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await settings.focus();
  await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
  await settings.press('Enter');
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator('.build-status')).toHaveCount(0);
  await expect(settings).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await nav.getByRole('button', {name: 'Navigation ausklappen'}).press('Enter');
  await expect(nav).toHaveCSS('width', '212px');
  await expect(settings.locator('span')).toHaveText('Einstellungen');
  await nav.getByRole('link', {name: 'Projekte', exact: true}).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(nav).toHaveCSS('width', '212px');
  await page.goBack();
  await expect(settings).toHaveAttribute('aria-current', 'page');
  await page.goForward();
  await expect(nav.getByRole('link', {name: 'Projekte', exact: true})).toHaveAttribute(
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
  await nav.getByRole('link', {name: 'Projekte', exact: true}).click();
  await expect(nav).toHaveCSS('width', '52px');
  await page.reload();
  await expect(nav).toHaveCSS('width', '212px');
  expect(workers).toEqual([]);
});

test('Navigation: settings follow R and leaving the workspace saves edits and its sidebar view', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Navigation und Autosave');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Navigation und Autosave'})).toBeVisible();
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  await expect(page.getByRole('navigation')).toHaveCount(1);
  expect(
    await nav
      .locator('.dw-nav-item')
      .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label'))),
  ).toEqual([
    'Navigation ausklappen',
    'Projekte',
    'Übersicht',
    'Daten',
    'SQL',
    'R',
    'Einstellungen',
    'Diagnose',
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
    for (const [label, selector] of [
      ['Übersicht', '.project-overview'],
      ['Daten', '.project-data-page'],
      ['SQL', '.sql-panels'],
      ['R', '.r-workbench'],
    ] as const) {
      const item = nav.getByRole(label === 'SQL' || label === 'R' ? 'button' : 'link', {
        name: label,
        exact: true,
      });
      await item.click();
      await expect(page.locator(selector)).toBeVisible();
      const content = page.locator('.workspace-content[data-save-state]');
      await expect(content).toHaveAttribute('data-save-state', 'saved');
      if (label === 'R')
        await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
          timeout: 60000,
        });
      await expect(page.locator('.app-error, .workspace-content > .error')).toHaveCount(0);
      await expect(page.locator('.build-status, .save-status')).toHaveCount(0);
      await expect(
        page.getByText('Entwicklungsstand · nicht abgenommen', {exact: true}),
      ).toHaveCount(0);
      await expect(page.getByText('Lokal gespeichert · kein Backup', {exact: true})).toHaveCount(0);
      const geometry = await content.evaluate((section) => ({
        headerBottom: document.querySelector('.app-header')!.getBoundingClientRect().bottom,
        top: section.getBoundingClientRect().top,
        firstChildTop: section.firstElementChild!.getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      expect(geometry.top).toBe(geometry.headerBottom);
      expect(geometry.firstChildTop).toBe(geometry.top);
      expect(geometry.overflow).toBe(false);
      await writeFile(
        info.outputPath(`navigation-${label}-${viewport.width}.json`),
        JSON.stringify(geometry, null, 2),
      );
      await page.screenshot({path: info.outputPath(`navigation-${label}-${viewport.width}.png`)});
    }
  }
  expect(errors).toEqual([]);
});

async function noticeGeometry(page: Page, info: TestInfo, name: string) {
  await page.mouse.move(0, 0);
  const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  await expect(close).toBeVisible();
  await expect(close).toHaveText('');
  await expect(close.locator('svg')).toHaveAttribute('viewBox', '0 0 16 16');
  await expect(close.locator('svg')).toHaveAttribute('focusable', 'false');
  const geometry = await close.evaluate((button) => {
    const banner = button.closest('.app-error')!;
    const text = banner.querySelector('.app-error-message')!;
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
        color: getComputedStyle(text).color,
        fontWeight: getComputedStyle(text).fontWeight,
      },
      color: style.color,
      iconColor: getComputedStyle(button.querySelector('svg')!).fill,
      background: style.backgroundColor,
      border: style.borderColor,
      width: style.width,
      height: style.height,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(geometry.text.fontWeight).toBe('400');
  expect(geometry.text.color).toBe('rgb(180, 35, 24)');
  expect(geometry.color).toBe('rgb(91, 102, 115)');
  expect(geometry.iconColor).toBe(geometry.color);
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
  await close.hover();
  try {
    for (const [state, background] of [
      ['hover', 'rgb(254, 228, 226)'],
      ['active', 'rgb(254, 228, 226)'],
    ] as const) {
      if (state === 'active') await page.mouse.down();
      await expect(close).toHaveCSS('color', 'rgb(180, 35, 24)');
      await expect(close.locator('svg')).toHaveCSS('fill', 'rgb(180, 35, 24)');
      await expect(close).toHaveCSS('background-color', background);
      await page.screenshot({path: info.outputPath(`${name}-${state}.png`)});
    }
  } finally {
    // Release outside the button so checking :active does not dismiss the notice.
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
  await expect(close).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  return geometry;
}

test('Notices: regular error text, neutral SVG and red interaction states with keyboard dismissal', async ({
  page,
  browserName,
}, info) => {
  await page.goto('/projects');
  await page.getByLabel('Projektdatei importieren').setInputFiles({
    name: 'defekt.dwproj',
    mimeType: 'application/zip',
    buffer: Buffer.from('invalid'),
  });
  await expect(page.getByRole('alert')).toContainText('ARCHIVE_INVALID');
  const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  const viewports = [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const zoom of [1, 2]) {
      await page.evaluate((value) => {
        document.documentElement.style.zoom = String(value);
      }, zoom);
      await noticeGeometry(page, info, `notice-short-${viewport.width}-zoom-${zoom}`);
    }
  }
  await close.click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1';
  });
  await page.getByLabel('Name des neuen Projekts').fill('Hinweisprüfung');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Hinweisprüfung'})).toBeVisible();
  await page.getByLabel('Projektname', {exact: true}).fill('');
  await page.getByLabel('Beschreibung', {exact: true}).focus();
  await expect(page.getByRole('alert')).toContainText('Bitte gib einen Projektnamen ein.');
  await expect(page.locator('.error-notice')).toHaveCount(0);
  await page.getByLabel('Projektname', {exact: true}).fill('Hinweisprüfung');
  await page.getByLabel('Beschreibung', {exact: true}).focus();
  // Field validation now belongs to the field. Exercise the global notice's long-text
  // geometry with an explicit UI fixture, independently of any engine or storage result.
  await page.evaluate(async () => {
    const entry = performance
      .getEntriesByType('resource')
      .find((resource) => new URL(resource.name).pathname === '/src/app/router.tsx');
    if (!entry) throw Error('Loaded router module missing');
    const {report} = (await import(entry.name)) as typeof import('../../src/app/router');
    report(
      new Error(
        'Testhinweis: Die angeforderte Operation konnte nicht abgeschlossen werden. Die eingegebenen Daten bleiben erhalten. Bitte prüfe die Verbindung und versuche die Operation erneut. Falls das Problem weiterhin besteht, kannst du eine lokale Diagnose für die weitere Prüfung erstellen.',
      ),
    );
  });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const zoom of [1, 2]) {
      await page.evaluate((value) => {
        document.documentElement.style.zoom = String(value);
      }, zoom);
      const geometry = await noticeGeometry(
        page,
        info,
        `notice-long-error-${viewport.width}-zoom-${zoom}`,
      );
      if (zoom === 2)
        expect(geometry.text.height).toBeGreaterThan(
          2 * Number.parseFloat(geometry.text.lineHeight),
        );
    }
  }
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

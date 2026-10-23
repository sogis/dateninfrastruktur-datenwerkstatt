import {test, expect} from '../persistentBrowser';

test('Action buttons v1.3: menu, split, overflow, keyboard, busy and dialog focus', async ({
  page,
}) => {
  await page.goto('/tests/design-system/');
  const menu = page.getByRole('button', {name: 'Daten hinzufügen', exact: true});
  const status = page.getByLabel('Aktionsstatus');
  await menu.click();
  await expect(status).toHaveText('Keine Aktion');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true})).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', {name: 'Zur Referenz'})).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(status).toHaveText('Portal');
  await expect(menu).toBeFocused();
  await menu.press('ArrowUp');
  await page.keyboard.press('Shift+Tab');
  await expect(menu).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await menu.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
  const main = page.getByRole('button', {name: 'CSV exportieren', exact: true});
  await expect(main).not.toHaveAttribute('aria-haspopup');
  await main.click();
  await expect(status).toHaveText('CSV');
  const arrow = page.getByRole('button', {name: 'Weitere Exportformate', exact: true});
  await arrow.press('ArrowUp');
  await expect(page.getByRole('menuitem', {name: 'Parquet exportieren'})).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const blocked = page.getByRole('menuitem', {name: 'Deaktiviertes Format'});
  await expect(blocked).toBeFocused();
  await blocked.press('Enter');
  await expect(status).toHaveText('CSV');
  await expect(page.getByRole('menu')).toBeVisible();
  await blocked.press('Home');
  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Parquet');
  await expect(main).toHaveText('CSV exportieren');
  await main.click();
  await expect(status).toHaveText('CSV');
  await expect(page.getByRole('button', {name: 'Nicht anzeigen'})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Gesperrtes Menü'})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Export läuft'})).toBeDisabled();
  await page.getByRole('button', {name: 'Verfügbare Alternativen'}).click();
  await page.getByRole('menuitem', {name: 'Andere verfügbare Variante'}).click();
  await expect(status).toHaveText('Alternative');
  await menu.click();
  await page.getByRole('menuitem', {name: 'Dialog aus Menü'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('heading', {name: 'Komponentenreferenz'}).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button', {name: 'Aktionen für Beispiel'}).focus();
  await expect(page.getByRole('tooltip', {name: 'Aktionen für Beispiel'})).toBeVisible();
});

test('Action buttons v1.3: connected geometry, viewport edges, enlarged text and touch targets', async ({
  page,
  browser,
}, info) => {
  await page.goto('/tests/design-system/');
  for (const size of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 640, height: 400},
  ]) {
    await page.setViewportSize(size);
    const arrow = page.getByRole('button', {name: 'Weitere Exportformate', exact: true});
    const main = page.getByRole('button', {name: 'CSV exportieren', exact: true});
    await main.scrollIntoViewIfNeeded();
    const a = (await main.boundingBox())!,
      b = (await arrow.boundingBox())!;
    expect(a.x + a.width).toBeCloseTo(b.x, 5);
    expect(a.height).toBeGreaterThanOrEqual(40);
    expect(b.width).toBeGreaterThanOrEqual(40);
    await arrow.click();
    const panel = (await page.getByRole('menu').boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(8);
    expect(panel.x + panel.width).toBeLessThanOrEqual(size.width - 8);
    expect(panel.y).toBeGreaterThanOrEqual(8);
    expect(panel.y + panel.height).toBeLessThanOrEqual(size.height - 8);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      size.width,
    );
  }
  await page.addStyleTag({content: 'html { font-size: 200%; }'});
  await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
  await expect(page.getByRole('menuitem', {name: 'Parquet exportieren'})).toBeVisible();
  await page.screenshot({path: info.outputPath('buttons-enlarged.png'), fullPage: true});
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: {width: 640, height: 800},
  });
  try {
    const touch = await context.newPage();
    await touch.goto('http://127.0.0.1:4173/tests/design-system/');
    for (const control of [
      touch.getByRole('button', {name: 'CSV exportieren', exact: true}),
      touch.getByRole('button', {name: 'Weitere Exportformate', exact: true}),
    ]) {
      const b = (await control.boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
    const mainBox = (await touch
      .getByRole('button', {name: 'CSV exportieren', exact: true})
      .boundingBox())!;
    const arrowBox = (await touch
      .getByRole('button', {name: 'Weitere Exportformate', exact: true})
      .boundingBox())!;
    expect(mainBox.x + mainBox.width).toBeLessThanOrEqual(arrowBox.x);
  } finally {
    await context.close();
  }
});

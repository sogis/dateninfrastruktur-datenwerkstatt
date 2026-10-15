import {createRequire} from 'node:module';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require = createRequire(join(process.cwd(), 'package.json'));
const {chromium, firefox, webkit, expect} = require('@playwright/test');
const directory = process.argv[2];
if (!directory) throw Error('Evidence directory required.');
const results = [];
for (const [name, engine] of Object.entries({chromium, firefox, webkit})) {
  const profile = await mkdtemp(join(tmpdir(), 'dw-lab-navigation-'));
  const context = await engine.launchPersistentContext(profile, {headless: true});
  try {
    const page = context.pages()[0];
    const errors = [], workers = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('worker', (worker) => workers.push(worker.url()));
    await page.setViewportSize({width: 1280, height: 800});
    await page.goto('http://127.0.0.1:4183/lab/settings');
    const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
    const settings = nav.getByRole('link', {name: 'Einstellungen', exact: true});
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
    await expect(nav).toHaveCSS('width', '52px');
    await page.reload();
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('link', {name: 'Arbeitsbereiche', exact: true}).click();
    await expect(page).toHaveURL('http://127.0.0.1:4183/lab/workspaces');
    await page.getByLabel('Name des neuen Arbeitsbereichs').fill('Bundled /lab/ navigation');
    await page.getByRole('button', {name: 'Neuer Arbeitsbereich', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Bundled /lab/ navigation'})).toBeVisible();
    await expect(nav.locator('.dw-nav-item')).toHaveCount(7);
    await nav.getByRole('button', {name: 'Navigation ausklappen'}).click();
    await expect(nav).toHaveCSS('width', '212px');
    await page.screenshot({path: join(directory, `lab-navigation-${name}.png`)});
    await page.getByLabel('Projektname', {exact: true}).fill('');
    await page.getByLabel('Beschreibung', {exact: true}).focus();
    await expect(page.getByRole('alert')).toContainText('too_small');
    const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
    await expect(close.locator('svg')).toHaveAttribute('viewBox', '0 0 16 16');
    await expect(close).toHaveCSS('color', 'rgb(11, 95, 255)');
    await close.press('Enter');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await settings.click();
    await expect(page).toHaveURL('http://127.0.0.1:4183/lab/settings');
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
    await page.reload();
    await expect(settings).toHaveAttribute('aria-current', 'page');
    expect(workers).toEqual([]);
    expect(errors).toEqual([]);
    results.push({browser: name, version: context.browser()?.version(), status: 'passed',
      checks: ['direct /lab/settings', 'reload', 'global sidebar', 'project sidebar',
        'blue SVG dismissal of real error', 'settings link retains base', 'no workers or pageerrors']});
    console.log(`${name}: /lab/ bundled UI passed`);
  } finally {
    await context.close();
    await rm(profile, {recursive: true, force: true});
  }
}
await writeFile(join(directory, 'lab-smoke.json'), JSON.stringify(results, null, 2));

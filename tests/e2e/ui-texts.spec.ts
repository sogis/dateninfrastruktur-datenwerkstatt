import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';

async function create(page: Page, name = 'Original · Projektname') {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill(name);
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name, exact: true})).toBeVisible();
}

async function documentText(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    await session.flush();
    return JSON.stringify(session.document);
  });
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  for (const group of await page.locator('.dw-meta-list:visible').all()) {
    expect(await group.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
  }
}

test('UI texts: inventory and hash checks stay distinct; archive and storage use labelled values at narrow widths', async ({
  page,
}, info) => {
  await create(page);
  const before = await documentText(page);
  await page.getByRole('link', {name: 'Diagnose', exact: true}).click();
  const diagnostics = page.locator('.diagnostics-page');
  await expect(diagnostics).toContainText(
    'Bei der Inventarprüfung wurden keine fehlenden oder verwaisten Dateien festgestellt.',
  );
  await expect(diagnostics).toContainText('Dateilängen und SHA-256 wurden noch nicht geprüft.');
  await expect(diagnostics.locator('.dw-notice')).toHaveCount(0);
  await page.getByRole('button', {name: 'Integrität prüfen', exact: true}).click();
  await expect(diagnostics).toContainText(
    'Dateilängen und SHA-256 wurden geprüft. Es wurden keine beschädigten Dateien festgestellt.',
  );
  await expect(diagnostics).not.toContainText('noch nicht geprüft');
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Projekt exportieren', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Projekt exportieren', exact: true});
  await expect(dialog.locator('dt')).toHaveText([
    'Datensätze',
    'Resultate',
    'Bekannte lokale Daten',
    'Temporäre Resultate',
    'Externe Datenstände',
    'Fehlende oder beschädigte Datenstände',
  ]);
  await expect(dialog.locator('dd')).toHaveText(['0', '0', '0 Bytes', '0', '0', '0']);
  await page.screenshot({path: info.outputPath('archive-labelled-values.png')});
  await page.keyboard.press('Escape');
  expect(await documentText(page)).toBe(before);
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    // Presentation probe for unavailable browser estimates; no persistence or engine mock.
    services.storageEstimate = async () => ({});
  });
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  await expect(storage).toContainText(
    'Die Daten werden lokal in diesem Browser gespeichert und nicht automatisch gesichert.',
  );
  await expect(storage.locator('dt')).toHaveText(['Geschätzter Verbrauch', 'Browserbudget']);
  await expect(storage.locator('dd')).toHaveText(['nicht verfügbar', 'nicht verfügbar']);
  for (const size of [
    {width: 1280, height: 800},
    {width: 390, height: 700},
  ]) {
    await page.setViewportSize(size);
    await noOverflow(page);
    await page.screenshot({path: info.outputPath(`storage-${size.width}.png`), fullPage: true});
  }
  await page.setViewportSize({width: 1280, height: 650});
  await page.addStyleTag({content: 'html {font-size: 200%}'});
  await noOverflow(page);
  await page.screenshot({path: info.outputPath('storage-text-200.png'), fullPage: true});
});

test('UI texts: real SQL status hierarchy, empty results and original text survive enlarged text and narrow work areas', async ({
  page,
}, info) => {
  await create(page, 'Text und Zahlen');
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  const run = async (code: string) => {
    await page.locator('.monaco-editor').click();
    await editor.press('ControlOrMeta+a');
    await page.keyboard.insertText(code);
    await editor.press('ControlOrMeta+s');
    await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
    await expect(page.locator('.run-summary-message')).toHaveText('Ausführung erfolgreich');
  };
  await run("SELECT '001 · Original' AS wert WHERE false");
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(0);
  await expect(
    page.locator('.result-toolbar .dw-meta-list').filter({hasText: 'Zeilen'}),
  ).toContainText('Zeilen0');
  await page
    .getByLabel('Analysename', {exact: true})
    .fill(
      'Langer Analysename für die gemeinsame Auswertung mit unveränderten Originaldaten und lesbaren Metadaten',
    );
  await run("SELECT '001 · Original' AS wert");
  await expect(page.locator('.result-grid tbody td')).toHaveText('001 · Original');
  await expect(page.locator('.analysis-toolbar [role="status"]')).toHaveText(/^Revision \d+$/);
  await expect(page.locator('.run-summary dt')).toHaveText(['Revision', 'Laufzeit']);
  await expect(page.locator('.run-summary dd').last()).toHaveText(/^[\d.]+ ms$/);
  const before = await documentText(page);
  await page.getByText('Laufdetails und eingefrorener Code', {exact: true}).click();
  await expect(page.locator('.run-details')).toContainText("SELECT '001 · Original' AS wert");
  expect(await documentText(page)).toBe(before);
  await page.getByText('Laufdetails und eingefrorener Code', {exact: true}).click();
  for (const size of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 640, height: 650},
  ]) {
    await page.setViewportSize(size);
    await page.locator('.result-section').evaluate((element) => element.scrollTo(0, 0));
    await noOverflow(page);
    await page.screenshot({path: info.outputPath(`sql-status-${size.width}.png`), fullPage: true});
  }
  await page.setViewportSize({width: 1280, height: 650});
  await page.addStyleTag({content: 'html {font-size: 200%}'});
  await page.locator('.result-section').evaluate((element) => element.scrollTo(0, 0));
  await noOverflow(page);
  await expect(page.locator('.run-summary-message')).toBeVisible();
  await page.screenshot({path: info.outputPath('sql-status-text-200.png'), fullPage: true});
});

test('UI texts: partial checks and cleanup errors retain counts and original diagnostic text', async ({
  page,
}, info) => {
  await create(page, 'Prüfzustände');
  const before = await documentText(page);
  const diagnostics = page.locator('.diagnostics-page');
  for (const hashesChecked of [false, true]) {
    await page.evaluate(async (hashesChecked) => {
      const path = '/tests/spike/appServices.ts';
      const {services} = (await import(path)) as typeof import('../spike/appServices');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      // Presentation-only reports for partial/failed checks, without changing the document.
      const missing =
        '00000000-0000-4000-8000-000000000001' as import('../../src/domain/model').ArtifactId;
      const corrupt =
        '00000000-0000-4000-8000-000000000002' as import('../../src/domain/model').ArtifactId;
      session.integrity = {
        referenced: [missing, corrupt],
        missing: [missing],
        corrupt: hashesChecked ? [corrupt] : [],
        orphanPaths: ['orphan.parquet'],
      };
      session.hashesChecked = hashesChecked;
    }, hashesChecked);
    await page.getByRole('link', {name: 'Daten', exact: true}).click();
    await page.getByRole('link', {name: 'Diagnose', exact: true}).click();
    await expect(diagnostics.locator('.dw-tone-warning dd')).toHaveText([
      '1',
      hashesChecked ? '1' : 'noch nicht geprüft',
      '1',
    ]);
    await expect(diagnostics).not.toContainText('keine beschädigten Dateien festgestellt');
    await expect(diagnostics).toContainText(
      hashesChecked
        ? 'Dateilängen und SHA-256 wurden geprüft.'
        : 'Dateilängen und SHA-256 wurden noch nicht geprüft.',
    );
  }
  expect(await documentText(page)).toBe(before);
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    services.workspaces.cleanAbandoned = async () => ({
      removed: [],
      failures: ['Datei A · Originalmeldung', 'Datei B: keine Schreibberechtigung'],
    });
  });
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen'}).click();
  await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
  await expect(storage).toContainText('Es wurden keine Dateien bereinigt.');
  await expect(storage).toContainText('2 Dateien konnten nicht bereinigt werden.');
  await expect(storage.locator('li')).toHaveText([
    'Datei A · Originalmeldung',
    'Datei B: keine Schreibberechtigung',
  ]);
  await page.screenshot({path: info.outputPath('cleanup-original-errors.png'), fullPage: true});
});

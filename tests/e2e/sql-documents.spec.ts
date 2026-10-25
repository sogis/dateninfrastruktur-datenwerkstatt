import {test, expect} from '../persistentBrowser';
import {readFile} from 'node:fs/promises';
import type {Page} from '@playwright/test';

async function create(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('SQL-Dokumente');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    await (await services.workspaces.open(location.pathname.split('/')[2]!)).flush();
  });
}
async function document(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    return (await services.workspaces.open(location.pathname.split('/')[2]!)).document;
  });
}

test('SQL documents: create a named document from Neu or Öffnen without changing the previous analysis', async ({
  page,
}, info) => {
  await create(page);
  const toolbar = page.locator('.analysis-toolbar');
  await expect(toolbar.getByRole('button')).toHaveText([
    'Ausführen',
    'Neu',
    'Öffnen',
    'Speichern',
    'Tabellen & Spalten',
    'Weitere Aktionen',
  ]);
  await page.locator('.monaco-editor').click();
  const code = page.getByRole('textbox', {name: 'Analysecode'});
  await code.press('ControlOrMeta+a');
  await page.keyboard.insertText('SELECT 41 AS wert;');
  await code.press('ControlOrMeta+s');
  await expect(page.locator('.workspace-save-indicator')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const id = Object.values(session.document.analyses)[0]!.id;
    session.updateAnalysis(id, {parameters: {jahr: 2025}});
    await session.flush();
  });
  const before = await document(page);
  const previous = Object.values(before.analyses)[0]!;
  const previousUrl = page.url();
  const newDialog = page.getByRole('dialog', {name: 'Neue SQL-Analyse', exact: true});
  await toolbar.getByRole('button', {name: 'Neu', exact: true}).click();
  const name = newDialog.getByLabel('Analysename', {exact: true});
  await expect(name).toBeFocused();
  await name.fill('Verwerfen');
  await newDialog.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  await expect(newDialog).toHaveCount(0);
  await expect(toolbar.getByRole('button', {name: 'Neu', exact: true})).toBeFocused();
  expect(await document(page)).toEqual(before);
  await toolbar.getByRole('button', {name: 'Neu', exact: true}).click();
  await name.fill('Auch verwerfen');
  await name.press('Escape');
  await expect(newDialog).toHaveCount(0);
  expect(await document(page)).toEqual(before);
  expect(page.url()).toBe(previousUrl);

  await toolbar.getByRole('button', {name: 'Öffnen', exact: true}).click();
  const documents = page.getByRole('dialog', {name: 'SQL-Analyse öffnen', exact: true});
  await expect(documents).toContainText('Geöffnet');
  await expect(documents).toContainText('Keine weiteren SQL-Analysen vorhanden.');
  await expect(documents.getByRole('button', {name: /^Analyse .* öffnen$/})).toHaveCount(0);
  await page.screenshot({path: info.outputPath('sql-open-single-document.png')});
  await documents.getByRole('button', {name: 'Neu', exact: true}).click();
  await expect(documents).toHaveCount(0);
  await expect(name).toBeFocused();
  await name.fill('   ');
  await newDialog.getByRole('button', {name: 'Erstellen', exact: true}).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  expect(await document(page)).toEqual(before);
  await name.fill('  Jahreszahlen  ');
  await page.screenshot({path: info.outputPath('sql-new-named-document.png')});
  await newDialog.getByRole('button', {name: 'Erstellen', exact: true}).click();
  await expect(newDialog).toHaveCount(0);
  await expect(page.locator('.analysis-name-text')).toHaveText('Analysename: Jahreszahlen');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 1 AS wert;');
  await expect(page.locator('.result-grid')).toHaveCount(0);
  const after = await document(page);
  expect(Object.keys(after.analyses)).toHaveLength(2);
  expect(after.analyses[previous.id]).toEqual(previous);
  const created = Object.values(after.analyses).find((item) => item.id !== previous.id)!;
  expect(created).toMatchObject({
    name: 'Jahreszahlen',
    code: 'SELECT 1 AS wert;',
    revision: 0,
    parameters: {},
    inputs: [],
  });
  expect(after.runs).toEqual(before.runs);
  await toolbar.getByRole('button', {name: 'Öffnen', exact: true}).click();
  await expect(documents).not.toContainText('Keine weiteren SQL-Analysen vorhanden.');
  await documents
    .getByRole('button', {name: 'Analyse Neue SQL-Abfrage öffnen', exact: true})
    .click();
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 41 AS wert;');
  await expect(page.getByRole('button', {name: 'Parameter (1)', exact: true})).toBeVisible();
  await expect(page.locator('.workspace-save-indicator')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page.reload();
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 41 AS wert;');
  expect(Object.values((await document(page)).analyses).map((item) => item.name)).toEqual([
    'Neue SQL-Abfrage',
    'Jahreszahlen',
  ]);
  expect((await document(page)).runs).toEqual(before.runs);
});

test('SQL documents: failed saves retain text for download and retry; invalid files add no analyses', async ({
  page,
}, info) => {
  await create(page);
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const repository: unknown = Reflect.get(session.persistence, 'repository');
    if (!repository || typeof repository !== 'object') throw Error('Missing repository');
    const commit: unknown = Reflect.get(repository, 'commit');
    if (typeof commit !== 'function') throw Error('Missing commit');
    const own = Object.hasOwn(repository, 'commit');
    Reflect.set(globalThis, '__restoreSqlSave', () => {
      if (own) Reflect.set(repository, 'commit', commit);
      else Reflect.deleteProperty(repository, 'commit');
    });
    Reflect.set(repository, 'commit', async () => {
      throw Error('SQL-Test: Speicher voll');
    });
  });
  const text = "-- Grüezi 👋\nSELECT '001', '<script>';\n";
  try {
    await page.locator('.monaco-editor').click();
    await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+a');
    await page.keyboard.insertText(text);
    await page.getByRole('button', {name: 'Speichern', exact: true}).click();
    await expect(page.locator('.workspace-save-indicator')).toHaveAttribute(
      'data-save-state',
      'error',
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.app-error')).toHaveCount(0);
    await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('menuitem', {name: 'SQL-Datei herunterladen', exact: true}).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('Neue_SQL-Abfrage.sql');
    expect(await download.failure()).toBeNull();
    expect(await readFile((await download.path())!, 'utf8')).toBe(text);
  } finally {
    await page.evaluate(() => {
      const restore: unknown = Reflect.get(globalThis, '__restoreSqlSave');
      if (typeof restore !== 'function') throw Error('Missing restore');
      restore();
      Reflect.deleteProperty(globalThis, '__restoreSqlSave');
    });
  }
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+s');
  await expect(page.locator('.workspace-save-indicator')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  const before = await document(page);
  for (const file of [
    {name: 'falsch.sql', buffer: Buffer.from([0xc3, 0x28]), message: 'UTF-8'},
    {name: 'zu-gross.sql', buffer: Buffer.alloc(1024 * 1024 + 1, 32), message: 'höchstens 1 MiB'},
    {name: 'anderes.txt', buffer: Buffer.from('SELECT 1'), message: 'Endung .sql'},
  ]) {
    await page
      .getByLabel('SQL-Datei öffnen', {exact: true})
      .setInputFiles({name: file.name, mimeType: 'application/sql', buffer: file.buffer});
    const error = page.getByRole('dialog', {
      name: 'SQL-Datei konnte nicht geöffnet werden',
      exact: true,
    });
    await expect(error).toContainText(file.message);
    await error.getByRole('button', {name: 'Schliessen', exact: true}).click();
    expect(await document(page)).toEqual(before);
  }
  await page.reload();
  await expect(page.locator('.monaco-editor')).toContainText('Grüezi 👋');
  expect(Object.values((await document(page)).analyses)[0]!.code).toBe(text);
  await page.locator('.monaco-editor').click();
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+a');
  await page.keyboard.insertText(`${text}-- Autosave\n`);
  await expect(page.locator('.workspace-save-indicator')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page.reload();
  await expect(page.locator('.monaco-editor')).toContainText('-- Autosave');
  expect(Object.values((await document(page)).analyses)[0]!.code).toBe(`${text}-- Autosave\n`);
  expect(Object.keys((await document(page)).runs)).toHaveLength(0);
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.archiveAnalysis(session.createAnalysis('sql', {name: 'Archiviert', code: 'SELECT 2'}));
    session.createAnalysis('r');
    await session.flush();
  });
  await page.getByRole('button', {name: 'Öffnen', exact: true}).click();
  const documents = page.getByRole('dialog', {name: 'SQL-Analyse öffnen'});
  await expect(documents).toContainText('Geöffnet');
  await expect(documents.locator('li')).toHaveCount(1);
  await expect(documents).not.toContainText(/Archiviert|Neues R-Skript/);
  await page.screenshot({path: info.outputPath('sql-document-list.png')});
});

test('SQL documents: a late file read after project navigation never creates a document', async ({
  page,
}) => {
  await create(page);
  const old = await document(page);
  await page.evaluate(() => {
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function () {
      if (this.name !== 'spaet.sql') return read.call(this);
      return new Promise<ArrayBuffer>((resolve) => {
        Reflect.set(globalThis, '__finishSqlRead', async () => {
          const bytes = await read.call(this);
          resolve(bytes);
        });
      });
    };
  });
  await page.getByLabel('SQL-Datei öffnen', {exact: true}).setInputFiles({
    name: 'spaet.sql',
    mimeType: 'application/sql',
    buffer: Buffer.from('SELECT 999'),
  });
  await page.getByRole('link', {name: 'Projekte', exact: true}).click();
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('Anderes Projekt');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.evaluate(async () => {
    const finish: unknown = Reflect.get(globalThis, '__finishSqlRead');
    if (typeof finish !== 'function') throw Error('Missing pending file read');
    await finish();
  });
  expect(Object.keys((await document(page)).analyses)).toHaveLength(0);
  await page.getByRole('link', {name: 'Projekte', exact: true}).click();
  await page.getByRole('link', {name: old.workspace.name, exact: true}).click();
  expect(Object.keys((await document(page)).analyses)).toEqual(Object.keys(old.analyses));
});

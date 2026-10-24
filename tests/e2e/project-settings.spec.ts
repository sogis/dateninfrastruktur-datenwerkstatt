import type {Page} from '@playwright/test';
import {test, expect} from '../persistentBrowser';

const navOf = (page: Page) => page.getByRole('navigation', {name: 'Hauptnavigation'});
const settingsOf = (page: Page) =>
  navOf(page).getByRole('link', {name: 'Einstellungen', exact: true});

async function create(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Einstellungen und Sitzung');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(
    page.getByRole('heading', {name: 'Einstellungen und Sitzung', exact: true}),
  ).toBeVisible();
  return page.url();
}

async function sessionOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    return {
      id: session.sessionId,
      readOnly: session.readOnly,
      document: session.document,
      busy: session.scheduler.getSnapshot(),
    };
  });
}

async function runtimeOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const runtimePath = '/src/infrastructure/monaco/runtime.ts';
    const {monaco} = (await import(
      runtimePath
    )) as typeof import('../../src/infrastructure/monaco/runtime');
    return {
      scope: session.getR().scope,
      epoch: session.getR().epoch,
      models: monaco.editor.getModels().map((model) => ({id: model.id, uri: model.uri.toString()})),
    };
  });
}

async function enter(page: Page, value: string) {
  await page.locator('.monaco-editor').click();
  const input = page.getByRole('textbox', {name: 'Analysecode'});
  await input.press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await input.press('ControlOrMeta+s');
}

async function editorStateOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/infrastructure/monaco/runtime.ts';
    const {monaco} = (await import(
      path
    )) as typeof import('../../src/infrastructure/monaco/runtime');
    const editor = monaco.editor.getEditors().at(-1);
    if (!editor) throw Error('Active Monaco editor missing');
    const options = editor.getRawOptions();
    return {
      position: editor.getPosition(),
      fontSize: options.fontSize,
      lineNumbers: options.lineNumbers,
      wordWrap: options.wordWrap,
    };
  });
}

test('Project settings: engine-free navigation, saved sidebar, global options, keyboard and responsive layout', async ({
  page,
}, info) => {
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  const url = await create(page);
  const before = await sessionOf(page);
  const nav = navOf(page);
  for (const label of ['Übersicht', 'Daten', 'Diagnose']) {
    await nav.getByRole('link', {name: label, exact: true}).click();
    const source = page.url();
    await page.keyboard.press('Tab');
    await settingsOf(page).focus();
    await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
    await settingsOf(page).press('Enter');
    await expect(page).toHaveURL(url + '/settings');
    await expect(settingsOf(page)).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('.dw-nav-item')).toHaveCount(8);
    await expect(page.locator('.project-context')).toHaveText('Projekt: Einstellungen und Sitzung');
    await expect(
      page.getByText('Diese Einstellungen gelten für alle Projekte in diesem Browser.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(nav).toHaveCSS('width', '52px');
    expect((await sessionOf(page)).id).toBe(before.id);
    await page.goBack();
    await expect(page).toHaveURL(source);
    await page.goForward();
    await expect(page).toHaveURL(url + '/settings');
  }
  await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  await expect(nav).toHaveCSS('width', '212px');
  await page.getByLabel('Seitenleiste standardmässig eingeklappt').check();
  await expect(nav).toHaveCSS('width', '212px');
  for (const width of [1440, 1280, 390]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('project-settings-' + width + '.png'),
      fullPage: true,
    });
  }
  await page.setViewportSize({width: 1280, height: 800});
  const style = await page.addStyleTag({content: 'html {font-size: 200%}'});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('project-settings-text-200.png'), fullPage: true});
  await style.evaluate((element) => element.parentNode?.removeChild(element));
  await page.reload();
  await expect(nav).toHaveCSS('width', '212px');
  expect((await sessionOf(page)).id).not.toBe(before.id);
  expect(workers).toEqual([]);
  // The explicit global entry remains engine-free and has no implicit project.
  await page.goto('/settings');
  await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  await expect(page.locator('.project-context')).toHaveCount(0);
  expect(workers).toEqual([]);
});

test('Project settings: real SQL/R results, model identity, undo, editor options and live scope survive', async ({
  page,
}) => {
  const workers: {url: string; closed: boolean}[] = [];
  page.on('worker', (worker) => {
    const entry = {url: worker.url(), closed: false};
    workers.push(entry);
    worker.on('close', () => {
      entry.closed = true;
    });
  });
  const url = await create(page);
  const nav = navOf(page);
  await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  const sqlUrl = page.url();
  await enter(page, 'SELECT i, random() AS zufall FROM range(350) t(i)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr').first()).toBeVisible();
  const rows = await page.locator('.result-grid tbody td').allTextContents();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  await editor.press('ControlOrMeta+End');
  await editor.press('End');
  await page.keyboard.insertText('\n-- erhalten');
  await editor.press('ControlOrMeta+s');
  await editor.press('ArrowLeft');
  const cursor = (await editorStateOf(page)).position;
  await nav.getByRole('button', {name: 'R', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
    timeout: 60000,
  });
  const rUrl = page.url();
  await enter(page, 'bleibt <- data.frame(wert=1:3); plot(bleibt$wert); cat("Sitzung bleibt")');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.r-plot img')).toBeVisible();
  await expect(
    page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  ).toBeEnabled();
  const before = await sessionOf(page);
  const runtime = await runtimeOf(page);
  const count = workers.length;
  await settingsOf(page).click();
  await expect(page).toHaveURL(url + '/settings');
  await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  await page.getByLabel('Zeilennummern', {exact: true}).uncheck();
  await page.getByLabel('Zeilenumbruch', {exact: true}).check();
  await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  await expect(page).toHaveURL(sqlUrl);
  await expect(page.locator('.view-lines')).toHaveCSS('font-size', '18px');
  expect(await editorStateOf(page)).toEqual({
    position: cursor,
    fontSize: 18,
    lineNumbers: 'off',
    wordWrap: 'on',
  });
  await expect(page.locator('.line-numbers')).toHaveCount(0);
  await expect(page.locator('.result-grid tbody td')).toHaveText(rows);
  await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  await editor.press('ControlOrMeta+z');
  await expect(page.locator('.view-lines')).not.toContainText('-- erhalten');
  await editor.press('ControlOrMeta+Shift+z');
  await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  await editor.press('ControlOrMeta+s');
  await settingsOf(page).click();
  await page.goBack();
  await expect(page).toHaveURL(sqlUrl);
  await page.goForward();
  await expect(page).toHaveURL(url + '/settings');
  await nav.getByRole('button', {name: 'R', exact: true}).click();
  await expect(page).toHaveURL(rUrl);
  await expect(page.locator('.r-plot img')).toBeVisible();
  await expect(
    page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  ).toBeEnabled();
  await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
  expect(await runtimeOf(page)).toEqual(runtime);
  const after = await sessionOf(page);
  expect(after.id).toBe(before.id);
  expect(after.document.runs).toEqual(before.document.runs);
  expect(after.document.results).toEqual(before.document.results);
  expect(workers).toHaveLength(count);
  expect(workers.every((worker) => !worker.closed)).toBe(true);
  await expect(page.locator('.app-error')).toHaveCount(0);
});

for (const kind of ['sql', 'r'] as const) {
  test(
    'Project settings: active ' +
      kind.toUpperCase() +
      ' continues through settings and cancels after return',
    async ({page}) => {
      const url = await create(page);
      await navOf(page)
        .getByRole('button', {name: kind === 'sql' ? 'SQL' : 'R', exact: true})
        .click();
      const analysisUrl = page.url();
      await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
        timeout: 60000,
      });
      await enter(
        page,
        kind === 'sql'
          ? 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)'
          : 'while (TRUE) { sqrt(42) }',
      );
      await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
      await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
      await expect
        .poll(async () => Object.values((await sessionOf(page)).document.runs).at(-1)?.status)
        .toBe('running');
      const before = await sessionOf(page);
      expect(before.busy).not.toBeNull();
      await settingsOf(page).click();
      await expect(page).toHaveURL(url + '/settings');
      const during = await sessionOf(page);
      expect(during.id).toBe(before.id);
      expect(during.document.runs).toEqual(before.document.runs);
      expect(during.busy).toBe(before.busy);
      await page.goBack();
      await expect(page).toHaveURL(analysisUrl);
      await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
      await expect(page.locator('.app-error')).toHaveCount(0);
      expect((await sessionOf(page)).id).toBe(before.id);
      await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
      // PostMessage cancellation replaces webR; allow its normal initialization budget.
      await expect.poll(async () => (await sessionOf(page)).busy, {timeout: 60000}).toBeNull();
      await expect(page.locator('.run-summary-message')).toHaveText('Ausführung abgebrochen');
      await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
        timeout: 60000,
      });
      await expect(page.locator('.app-error')).toHaveCount(0);
      // A real follow-up execution proves the cancelled engine can be used again.
      await enter(page, kind === 'sql' ? 'SELECT 42 AS weiter' : 'cat("WEITER_NACH_ABBRUCH")');
      await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
      if (kind === 'sql') await expect(page.locator('.result-grid tbody td')).toHaveText('42');
      else await expect(page.getByRole('log')).toContainText('WEITER_NACH_ABBRUCH');
    },
  );
}

test('Project settings: writer lease and stored files survive cleanup while reader edits personal settings', async ({
  page,
  context,
}) => {
  const url = await create(page);
  const before = await sessionOf(page);
  await settingsOf(page).click();
  const reader = await context.newPage();
  await reader.goto(url + '/settings');
  await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  expect((await sessionOf(reader)).readOnly).toBe(true);
  await reader.getByLabel('Editor-Schriftgrösse').selectOption('19');
  await expect(reader.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  const files = await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const stored = await services.workspaces.create('Gespeichertes anderes Projekt');
    const root = await navigator.storage.getDirectory();
    const projects = await root.getDirectoryHandle('workspaces', {create: true});
    const files = [
      {
        workspace: location.pathname.split('/')[2]!,
        artifact: crypto.randomUUID(),
        content: 'active-project-file',
      },
      {
        workspace: stored.workspace.id,
        artifact: crypto.randomUUID(),
        content: 'stored-project-file',
      },
      {
        workspace: crypto.randomUUID(),
        artifact: crypto.randomUUID(),
        content: 'abandoned-project-file',
      },
    ];
    for (const file of files) {
      const directory = await projects.getDirectoryHandle(file.workspace, {create: true});
      const artifacts = await directory.getDirectoryHandle('artifacts', {create: true});
      const writer = await (
        await artifacts.getFileHandle(file.artifact, {create: true})
      ).createWritable();
      await writer.write(file.content);
      await writer.close();
    }
    return files;
  });
  const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  await page
    .getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen', exact: true})
    .click();
  await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(storage.getByRole('status')).toHaveText('1 Dateien wurden bereinigt.');
  expect(
    await page.evaluate(async (files) => {
      const root = await navigator.storage.getDirectory();
      const projects = await root.getDirectoryHandle('workspaces');
      return Promise.all(
        files.map(async (file) => {
          const directory = await projects.getDirectoryHandle(file.workspace);
          const artifacts = await directory.getDirectoryHandle('artifacts');
          try {
            return (await (await artifacts.getFileHandle(file.artifact)).getFile()).text();
          } catch (error) {
            if (error instanceof DOMException && error.name === 'NotFoundError') return null;
            throw error;
          }
        }),
      );
    }, files),
  ).toEqual(['active-project-file', 'stored-project-file', null]);
  expect((await sessionOf(page)).id).toBe(before.id);
  expect((await sessionOf(page)).readOnly).toBe(false);
  await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  await expect(
    reader.getByText('Das Schreibrecht ist weiterhin belegt.', {exact: true}),
  ).toBeVisible();
  await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  await page
    .getByRole('menuitem', {name: 'Projekte verwalten und gezielt löschen', exact: true})
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  await expect(
    reader.getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(reader).toHaveURL(url + '/settings');
  expect((await sessionOf(reader)).readOnly).toBe(false);
});

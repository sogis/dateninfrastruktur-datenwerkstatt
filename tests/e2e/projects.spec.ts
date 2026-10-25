import {
  keepSqlResult,
  expectSqlKeepDisabled,
  openSqlRunDetails,
  showKeptSqlResult,
} from '../ui/sqlActions';
import {test, expect} from '../persistentBrowser';
import type {Page, Route} from '@playwright/test';
import type {WorkspaceDocument} from '../../src/domain/model';
import {mkdir, readFile} from 'node:fs/promises';

const evidence = 'docs/verification/sql-workbench/projects';

async function createProject(page: Page, name: string) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill(name);
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name, exact: true})).toBeVisible();
  return page.url();
}

async function documentOf(page: Page) {
  return page.evaluate(
    async (path) => {
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      await session.flush();
      return {document: session.document, sessionId: session.sessionId};
    },
    await servicesModuleOf(page),
  );
}

async function servicesModuleOf(page: Page) {
  return page.evaluate(() => {
    // Vite may retain a cache-busting query in the app graph after earlier edits.
    // Import the exact loaded module, so assertions inspect the actual UI session.
    const entry = performance
      .getEntriesByType('resource')
      .find((entry) => new URL(entry.name).pathname === '/src/app/services.ts');
    if (!entry) throw new Error('Loaded application services module missing');
    return entry.name;
  });
}

async function importCsv(page: Page, filename: string, csv: string, replace = false) {
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  if (!replace) await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page
    .getByRole(replace ? 'button' : 'menuitem', {
      name: replace ? 'Daten ersetzen' : 'Datei hinzufügen',
      exact: true,
    })
    .click();
  await page.getByLabel('Datei (CSV oder Parquet, maximal 128 MiB)').setInputFiles({
    name: filename,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await page.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await page.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function code(page: Page, value: string) {
  const input = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await input.press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await input.press('ControlOrMeta+s');
}

function immutableHistory(document: WorkspaceDocument) {
  return {
    runs: document.runs,
    results: document.results,
    datasetVersions: document.datasetVersions,
  };
}

test('Projects: a late real editor module preserves direct reset focus and its action', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 900});
  let releaseEditor: () => void = () => {};
  const editorGate = new Promise<void>((resolve) => {
    releaseEditor = resolve;
  });
  let moduleIntercepted = false;
  const deliveries: Promise<void>[] = [];
  const modulePattern = '**/src/ui/CodeEditorImpl.tsx*';
  const holdEditorModule = (route: Route) => {
    const delivery = (async () => {
      const response = await route.fetch();
      moduleIntercepted = true;
      await editorGate;
      await route.fulfill({response});
    })();
    deliveries.push(delivery);
    return delivery;
  };
  await page.route(modulePattern, holdEditorModule);
  try {
    await createProject(page, 'Verzögerter Editor');
    await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
    await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
    await expect.poll(() => moduleIntercepted).toBe(true);
    await expect(page.getByText('Editor wird geladen …', {exact: true})).toBeVisible();
    await expect(page.locator('.monaco-editor')).toHaveCount(0);
    const splitter = page.getByRole('separator', {
      name: 'Grösse von Editor und Resultat ändern',
    });
    await expect(splitter).toHaveAttribute('aria-valuenow', '45');
    await splitter.focus();
    await splitter.press('ArrowDown');
    await expect(splitter).not.toHaveAttribute('aria-valuenow', '45');

    const menu = page.getByRole('button', {name: 'Weitere Aktionen', exact: true});
    await menu.click();
    const reset = page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen', exact: true});
    await reset.focus();
    await expect(reset).toBeFocused();
    releaseEditor();

    await expect(page.locator('.monaco-editor')).toBeVisible();
    // Monaco keeps its unfocused input textarea at zero size in Firefox.
    await expect(page.getByRole('textbox', {name: 'Analysecode'})).toBeAttached();
    await expect(page.getByText('Editor wird geladen …', {exact: true})).toHaveCount(0);
    await expect(reset).toBeFocused();
    await reset.press('Enter');
    await expect(splitter).toHaveAttribute('aria-valuenow', '45');
    await expect(menu).toBeFocused();
  } finally {
    releaseEditor();
    try {
      await Promise.all(deliveries);
    } finally {
      await page.unroute(modulePattern, holdEditorModule);
    }
  }
});

test('Projects: distinct overview/data pages preserve one session and live SQL/R workers across navigation', async ({
  page,
}, info) => {
  const workers: {url: string; closed: boolean}[] = [];
  page.on('worker', (worker) => {
    const record = {url: worker.url(), closed: false};
    workers.push(record);
    worker.on('close', () => {
      record.closed = true;
    });
  });
  const url = await createProject(page, 'Klares Projekt');
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  await expect(nav.getByRole('link', {name: 'Projekte', exact: true})).toBeVisible();
  await expect(nav.getByRole('link', {name: 'Übersicht', exact: true})).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByLabel('Projektname', {exact: true})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Analysen', exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Daten hinzufügen', exact: true})).toHaveCount(0);
  await expect(page.locator('.dataset-list')).toHaveCount(0);
  expect(workers).toEqual([]);
  const initial = await documentOf(page);

  await importCsv(page, 'messung.csv', 'id;wert\n1;10\n2;20\n');
  await expect(page).toHaveURL(`${url}/data`);
  await expect(page.getByRole('heading', {name: 'Daten', exact: true})).toBeVisible();
  await expect(page.getByLabel('Projektname', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Projekt exportieren', exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Neue Analyse', exact: true})).toHaveCount(0);
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await expect(page.getByRole('region', {name: 'Datenübersicht'})).toContainText('messung');
  await expect(page.getByRole('region', {name: 'Datenübersicht'})).toContainText('2 Zeilen');
  await mkdir(evidence, {recursive: true});
  await page.screenshot({
    path: `${evidence}/${info.project.name}-project-overview.png`,
    fullPage: true,
  });
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  const sqlUrl = page.url();
  await code(page, 'SELECT sum(wert) AS summe FROM data.messung');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText(['30']);
  await page.getByRole('button', {name: 'R', exact: true}).click();
  const rUrl = page.url();
  await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
  await code(page, 'merkzahl <- 73; cat(merkzahl)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.getByRole('log')).toContainText('73');
  const before = await documentOf(page);
  expect(before.sessionId).toBe(initial.sessionId);
  const runtimeWorkers = workers.filter((worker) => !worker.url.includes('editor.worker'));
  expect(runtimeWorkers).toHaveLength(2);

  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.goBack();
  await expect(page).toHaveURL(url);
  await page.goForward();
  await expect(page).toHaveURL(`${url}/data`);
  await page.getByRole('button', {name: 'SQL', exact: true}).click();
  await expect(page).toHaveURL(sqlUrl);
  await expect(page.locator('.result-grid tbody td')).toHaveText(['30']);
  await page.getByRole('button', {name: 'R', exact: true}).click();
  await expect(page).toHaveURL(rUrl);
  await expect(page.getByRole('button', {name: /merkzahl Klasse: numeric/})).toBeVisible();
  const after = await documentOf(page);
  expect(after.sessionId).toBe(initial.sessionId);
  expect(immutableHistory(after.document)).toEqual(immutableHistory(before.document));
  expect(workers.filter((worker) => !worker.url.includes('editor.worker'))).toEqual(runtimeWorkers);
  expect(runtimeWorkers.every((worker) => !worker.closed)).toBe(true);
});

test('Projects: CSV replacement keeps both immutable versions with current/newest labels and readable origin/schema', async ({
  page,
}, info) => {
  await createProject(page, 'Datenstände');
  await importCsv(page, 'erste.csv', 'id;wert\n1;10\n');
  await importCsv(page, 'zweite.csv', 'id;wert;hinweis\n1;20;neu\n2;30;neu\n', true);
  const before = await documentOf(page);
  const datasets = Object.values(before.document.datasets);
  expect(datasets).toHaveLength(1);
  const versions = Object.values(before.document.datasetVersions).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  expect(versions).toHaveLength(2);
  expect(datasets[0]!.currentVersionId).toBe(versions[0]!.id);
  const history = page.locator('.dataset-history');
  await expect(history).toHaveCount(1);
  await expect(history.locator('ol')).toBeHidden();
  await history.getByText('Datenstände und Herkunft (2)', {exact: true}).click();
  const rows = history.locator('.dataset-version');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Aktueller Datenstand');
  await expect(rows.nth(0)).toContainText('Datei zweite.csv (CSV)');
  await expect(rows.nth(1)).toContainText('Früherer Datenstand');
  await expect(rows.nth(1)).toContainText('Datei erste.csv (CSV)');
  expect(
    await rows
      .locator('time')
      .evaluateAll((times) => times.map((time) => time.getAttribute('datetime'))),
  ).toEqual(versions.map((version) => version.createdAt));
  await rows.nth(0).getByText('Schema (3 Spalten)', {exact: true}).click();
  await expect(rows.nth(0)).toContainText('hinweis');
  await rows.nth(1).getByText('Schema (2 Spalten)', {exact: true}).click();
  await expect(rows.nth(1).getByRole('cell', {name: 'hinweis', exact: true})).toHaveCount(0);
  await mkdir(evidence, {recursive: true});
  await page.screenshot({
    path: `${evidence}/${info.project.name}-project-data-history.png`,
    fullPage: true,
  });
  expect((await documentOf(page)).document).toEqual(before.document);
  await page.reload();
  await page
    .locator('.dataset-history')
    .getByText('Datenstände und Herkunft (2)', {exact: true})
    .click();
  await expect(page.locator('.dataset-version').first()).toContainText('Aktueller Datenstand');
  await expect(page.locator('.dataset-version').first()).toContainText('zweite.csv');
  await page.getByRole('button', {name: 'Daten ansehen', exact: true}).click();
  await expect(page.getByRole('cell', {name: '20', exact: true})).toBeVisible();
  await expect(page.getByRole('cell', {name: '30', exact: true})).toBeVisible();
  expect((await documentOf(page)).document).toEqual(before.document);
});

test('Projects: save indicator stays bottom left without moving the SQL editor while saving', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await createProject(page, 'Ruhiger Speicherstatus');
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await documentOf(page);
  const indicator = page.locator('.workspace-save-indicator');
  await expect(indicator).toHaveAttribute('data-tone', 'success');
  const geometry = () =>
    page.locator('.workspace-content').evaluate((content) =>
      ['.analysis-toolbar', '.monaco-editor', '.result-section'].map((selector) => {
        const rect = content.querySelector(selector)!.getBoundingClientRect();
        return {top: rect.top, height: rect.height};
      }),
    );
  const before = await geometry();
  const servicesModule = await servicesModuleOf(page);
  await page.evaluate(async (path) => {
    const {services} = (await import(path)) as typeof import('../../src/app/services');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const repository: unknown = Reflect.get(session.persistence, 'repository');
    if (!repository || typeof repository !== 'object') throw Error('Project repository missing');
    const original: unknown = Reflect.get(repository, 'commit');
    if (typeof original !== 'function') throw Error('Project commit missing');
    let resume!: () => void;
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    Reflect.set(globalThis, '__saveIndicatorCommit', {
      repository,
      original,
      own: Object.hasOwn(repository, 'commit'),
      resume,
    });
    Reflect.set(repository, 'commit', async (...args: unknown[]) => {
      await gate;
      return Reflect.apply(original, repository, args);
    });
  }, servicesModule);
  try {
    const input = page.getByRole('textbox', {name: 'Analysecode'});
    await page.locator('.monaco-editor').click();
    await input.press('ControlOrMeta+a');
    await page.keyboard.insertText('SELECT 2 AS wert;');
    await expect(indicator).toHaveAttribute('data-save-state', 'dirty');
    await expect(indicator).toHaveAttribute('data-tone', 'warning');
    expect(await geometry()).toEqual(before);
    await input.press('ControlOrMeta+s');
    await expect(indicator).toHaveAttribute('data-save-state', 'saving');
    expect(await geometry()).toEqual(before);
    await expect(page.locator('.save-status, .app-error, .workspace-content > .error')).toHaveCount(
      0,
    );
    const bounds = await indicator.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(40);
    expect(bounds!.height).toBe(40);
    expect(bounds!.x).toBe(6);
    expect(bounds!.y).toBe(852);
    await page.getByRole('button', {name: 'Navigation ausklappen'}).click();
    expect(await indicator.boundingBox()).toEqual(bounds);
    await indicator.focus();
    await indicator.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(indicator).toBeFocused();
    await expect(
      page.getByRole('tooltip', {name: 'Änderungen werden gespeichert …'}),
    ).toBeVisible();
    await indicator.press('Enter');
    const status = page.getByRole('dialog', {name: 'Speicherstatus', exact: true});
    await expect(status.getByText('Änderungen werden gespeichert …', {exact: true})).toBeVisible();
    await status.press('Escape');
    await expect(indicator).toBeFocused();
  } finally {
    await page.evaluate(() => {
      const saved: unknown = Reflect.get(globalThis, '__saveIndicatorCommit');
      if (!saved || typeof saved !== 'object') throw Error('Original project commit missing');
      const repository: unknown = Reflect.get(saved, 'repository');
      const original: unknown = Reflect.get(saved, 'original');
      const resume: unknown = Reflect.get(saved, 'resume');
      if (
        !repository ||
        typeof repository !== 'object' ||
        typeof original !== 'function' ||
        typeof resume !== 'function'
      )
        throw Error('Original project repository missing');
      if (Reflect.get(saved, 'own')) Reflect.set(repository, 'commit', original);
      else Reflect.deleteProperty(repository, 'commit');
      resume();
      Reflect.deleteProperty(globalThis, '__saveIndicatorCommit');
    });
  }
  await expect(indicator).toHaveAttribute('data-save-state', 'saved');
  await expect(indicator).toHaveAttribute('data-tone', 'success');
});

test('Projects: a failed unpublished change can keep the previous project from save details', async ({
  page,
}) => {
  await createProject(page, 'Nicht veröffentlichter Stand');
  const before = await documentOf(page);
  await page.evaluate(
    async (path) => {
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      const repository: unknown = Reflect.get(session.persistence, 'repository');
      if (!repository || typeof repository !== 'object') throw Error('Project repository missing');
      const original: unknown = Reflect.get(repository, 'commit');
      if (typeof original !== 'function') throw Error('Project commit missing');
      const own = Object.hasOwn(repository, 'commit');
      Reflect.set(repository, 'commit', async () => {
        throw Error('Test: Veröffentlichung fehlgeschlagen');
      });
      try {
        await session.persistence.publish((document) => {
          document.workspace.description = 'Darf nicht erscheinen';
        });
      } catch {
        // The actual coordinator retains the already committed project after this fault.
      } finally {
        if (own) Reflect.set(repository, 'commit', original);
        else Reflect.deleteProperty(repository, 'commit');
      }
    },
    await servicesModuleOf(page),
  );
  const indicator = page.locator('.workspace-save-indicator');
  await expect(indicator).toHaveAccessibleName('Speicherstatus: Speichern fehlgeschlagen');
  await expect(indicator).toHaveAttribute('data-tone', 'warning');
  await indicator.click();
  const status = page.getByRole('dialog', {name: 'Speicherstatus', exact: true});
  await expect(status.getByRole('alert')).toContainText('Test: Veröffentlichung fehlgeschlagen');
  await status
    .getByRole('button', {name: 'Vorherigen Projektstand beibehalten', exact: true})
    .click();
  await status.getByRole('button', {name: 'Schliessen', exact: true}).click();
  await expect(indicator).toHaveAttribute('data-tone', 'success');
  expect((await documentOf(page)).document).toEqual(before.document);
});

test('Projects: a failed metadata save blocks external navigation and preserves the editing session until retry', async ({
  page,
}) => {
  const url = await createProject(page, 'Speicherfehler');
  const before = await documentOf(page);
  const servicesModule = await servicesModuleOf(page);
  await page.evaluate(async (path) => {
    const {services} = (await import(path)) as typeof import('../../src/app/services');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const repository: unknown = Reflect.get(session.persistence, 'repository');
    if (!repository || typeof repository !== 'object')
      throw new Error('Project repository missing');
    const original: unknown = Reflect.get(repository, 'commit');
    if (typeof original !== 'function') throw new Error('Project commit missing');
    Reflect.set(globalThis, '__projectCommitBeforeFailure', {
      repository,
      original,
      own: Object.hasOwn(repository, 'commit'),
    });
    Reflect.set(repository, 'commit', async () => {
      Reflect.set(globalThis, '__projectCommitFailureReached', true);
      throw new Error('Test: Projektmetadaten können nicht gespeichert werden');
    });
  }, servicesModule);
  try {
    await page
      .getByLabel('Beschreibung', {exact: true})
      .fill('Dieser Entwurf muss erhalten bleiben');
    const pending = await page.evaluate(async (path) => {
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      return {
        description: session.document.workspace.description,
        generation: session.persistence.generation,
        savedGeneration: session.persistence.savedGeneration,
      };
    }, servicesModule);
    expect(pending.description).toBe('Dieser Entwurf muss erhalten bleiben');
    expect(pending.generation).toBeGreaterThan(pending.savedGeneration);
    await page.getByRole('link', {name: 'Projekte', exact: true}).click();
    expect(
      await page.evaluate(() => Reflect.get(globalThis, '__projectCommitFailureReached')),
    ).toBe(true);
    await expect(page).toHaveURL(url);
    const indicator = page.getByRole('button', {name: 'Speicherstatus: Speichern fehlgeschlagen'});
    await expect(indicator).toHaveAttribute('data-tone', 'warning');
    await expect(page.locator('.save-status, .app-error, .workspace-content > .error')).toHaveCount(
      0,
    );
    await indicator.click();
    const status = page.getByRole('dialog', {name: 'Speicherstatus', exact: true});
    await expect(status.getByRole('alert')).toContainText('Test: Projektmetadaten');
    await status.getByRole('button', {name: 'Schliessen', exact: true}).click();
    await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
      'Dieser Entwurf muss erhalten bleiben',
    );
    const retained = await page.evaluate(async (path) => {
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      return {
        sessionId: session.sessionId,
        dirty: session.persistence.generation > session.persistence.savedGeneration,
      };
    }, servicesModule);
    expect(retained).toEqual({sessionId: before.sessionId, dirty: true});
    // Settings is now internal: a failed save must not discard the draft or block it.
    await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
    await expect(page).toHaveURL(`${url}/settings`);
    await expect(indicator).toHaveAttribute('data-tone', 'warning');
    await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
    await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
      'Dieser Entwurf muss erhalten bleiben',
    );
    const afterSettings = await page.evaluate(async (path) => {
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      return {
        sessionId: session.sessionId,
        dirty: session.persistence.generation > session.persistence.savedGeneration,
      };
    }, servicesModule);
    expect(afterSettings).toEqual(retained);
  } finally {
    await page.evaluate(() => {
      const saved: unknown = Reflect.get(globalThis, '__projectCommitBeforeFailure');
      if (!saved || typeof saved !== 'object') throw new Error('Original project commit missing');
      const repository: unknown = Reflect.get(saved, 'repository');
      const original: unknown = Reflect.get(saved, 'original');
      if (!repository || typeof repository !== 'object' || typeof original !== 'function')
        throw new Error('Original project repository missing');
      if (Reflect.get(saved, 'own')) Reflect.set(repository, 'commit', original);
      else Reflect.deleteProperty(repository, 'commit');
      Reflect.deleteProperty(globalThis, '__projectCommitBeforeFailure');
      Reflect.deleteProperty(globalThis, '__projectCommitFailureReached');
    });
  }
  await page.getByRole('button', {name: 'Speicherstatus: Speichern fehlgeschlagen'}).click();
  await page.getByRole('button', {name: 'Speichern erneut versuchen', exact: true}).click();
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page
    .getByRole('dialog', {name: 'Speicherstatus', exact: true})
    .getByRole('button', {name: 'Schliessen', exact: true})
    .click();
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.goBack();
  await expect(page).toHaveURL(url);
  await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
    'Dieser Entwurf muss erhalten bleiben',
  );
  await page.reload();
  await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
    'Dieser Entwurf muss erhalten bleiben',
  );
});

test('Projects: two SQL run snapshots stay readable and kept results survive edits, paging and reload without rerunning', async ({
  page,
}, info) => {
  await createProject(page, 'Eingefrorene Läufe');
  await importCsv(page, 'messung.csv', 'id;wert\n1;10\n');
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  const firstCode = 'SELECT i, wert + 11 AS wert FROM range(150) t(i), data.messung ORDER BY i';
  const secondCode = 'SELECT i, wert + 22 AS wert FROM range(150) t(i), data.messung ORDER BY i';
  for (const text of [firstCode, secondCode]) {
    await code(page, text);
    await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
    await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
    await keepSqlResult(page);
    await expect(page.locator('.result-footer')).toContainText('150 Zeilen');
    await expectSqlKeepDisabled(page);
  }
  await code(page, 'SELECT 999 AS noch_nicht_ausgefuehrt');
  const before = await documentOf(page);
  const runs = Object.values(before.document.runs);
  expect(runs).toHaveLength(2);
  expect(runs.map((run) => run.snapshot.code)).toEqual([firstCode, secondCode]);
  await showKeptSqlResult(page, 1);
  await expect(page.locator('.result-grid tbody tr').first().locator('td')).toHaveText(['0', '21']);
  const details = await openSqlRunDetails(page);
  await expect(details).toContainText(firstCode);
  await expect(details).toContainText('SQL-Projektsnapshot');
  await expect(details).toContainText('Möglicherweise verwendet');
  await expect(details).toContainText('messung');
  await expect(details).not.toContainText('SELECT 999');
  await mkdir(evidence, {recursive: true});
  await page.screenshot({
    path: `${evidence}/${info.project.name}-project-sql-history.png`,
    fullPage: true,
  });
  await details.getByRole('button', {name: 'Schliessen', exact: true}).click();
  await page.getByRole('button', {name: 'Nächste Seite', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr').first().locator('td')).toHaveText([
    '100',
    '21',
  ]);
  await page.getByRole('button', {name: 'Vorherige Seite', exact: true}).click();
  await showKeptSqlResult(page, 0);
  await expect(page.locator('.result-grid tbody tr').first().locator('td')).toHaveText(['0', '32']);
  await openSqlRunDetails(page);
  await expect(details).toContainText(secondCode);
  await details.getByRole('button', {name: 'Schliessen', exact: true}).click();
  expect((await documentOf(page)).document).toEqual(before.document);
  await page.reload();
  await expect(page.locator('.view-lines')).toContainText(/SELECT\s+999/);
  await showKeptSqlResult(page, 1);
  await expect(page.locator('.result-grid tbody tr').first().locator('td')).toHaveText(['0', '21']);
  expect((await documentOf(page)).document).toEqual(before.document);

  // A recipe retains provenance and run snapshots while explicitly omitting data bytes.
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Projekt exportieren', exact: true}).click();
  await page.getByLabel('Archivmodus').selectOption('recipe');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Archiv herunterladen', exact: true}).click();
  const bytes = await readFile((await (await downloading).path())!);
  await page.getByRole('link', {name: 'Projekte', exact: true}).click();
  await page.getByLabel('Projektdatei importieren').setInputFiles({
    name: 'provenienz.dwproj',
    mimeType: 'application/zip',
    buffer: bytes,
  });
  await page.getByRole('button', {name: 'Als neues Projekt importieren', exact: true}).click();
  await page.locator('.analysis-list a').click();
  const importedBefore = await documentOf(page);
  const firstImportedRun = Object.values(importedBefore.document.runs).find(
    (run) => run.snapshot.code === firstCode,
  )!;
  expect(firstImportedRun.snapshot.code).toBe(firstCode);
  await showKeptSqlResult(page, 1);
  await openSqlRunDetails(page);
  await expect(page.locator('.run-inputs')).toContainText('messung');
  await expect(page.locator('.run-inputs')).toContainText(
    'Nicht verfügbar, da das Projektarchiv keine Datenbytes enthält.',
  );
  await expect(page.locator('.run-results')).toContainText(
    'Nicht verfügbar: Projektdatei enthält keine Ergebnisdaten',
  );
  await page
    .getByRole('dialog', {name: 'Laufdetails', exact: true})
    .getByRole('button', {name: 'Schliessen', exact: true})
    .click();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'CSV exportieren', exact: true})).toBeDisabled();
  expect((await documentOf(page)).document).toEqual(importedBefore.document);
});

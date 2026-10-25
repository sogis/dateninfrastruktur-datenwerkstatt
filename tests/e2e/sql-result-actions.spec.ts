import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';
import {openSqlDatasetDialog, openSqlResultActions, openSqlRunDetails} from '../ui/sqlActions';

async function create(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('Ergebnisaktionen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
}

async function run(page: Page, code: string) {
  await page.locator('.monaco-editor').click();
  const input = page.getByRole('textbox', {name: 'Analysecode', exact: true});
  await input.press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
  await input.press('ControlOrMeta+s');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
}

async function documentOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    await session.flush();
    return structuredClone(session.document);
  });
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw Error(`Missing geometry element: ${selector}`);
      const {x, y, width, height, bottom} = element.getBoundingClientRect();
      return {x, y, width, height, bottom};
    };
    const grid = document.querySelector('.result-grid');
    return {
      editor: rect('.code-editor'),
      result: rect('.result-section'),
      footer: rect('.result-footer'),
      scroll: grid ? [grid.scrollTop, grid.scrollLeft] : [],
    };
  });
}

async function expectBottom(page: Page) {
  await expect
    .poll(async () => {
      const box = await page.locator('.result-section').boundingBox();
      return Math.abs(box!.y + box!.height - page.viewportSize()!.height);
    })
    .toBeLessThanOrEqual(1);
  await expect
    .poll(async () => {
      const box = await page.locator('.result-footer').boundingBox();
      return Math.abs(box!.y + box!.height - page.viewportSize()!.height);
    })
    .toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('SQL result actions: modal actions preserve document, scrolling and bottom edge across layouts and unavailable results', async ({
  page,
}, info) => {
  await page.setViewportSize({width: 1440, height: 900});
  await create(page);
  const code = 'SELECT i::INTEGER AS id, (i*2)::INTEGER AS wert FROM range(350) t(i)';
  await run(page, code);
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  const before = await documentOf(page);
  await expect(page.locator('.result-section > details')).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Aufbewahren', exact: true})).toHaveCount(0);
  const menu = await openSqlResultActions(page);
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Aufbewahren',
    'Als Datensatz übernehmen …',
    'Laufdetails …',
  ]);
  await expect(menu.getByRole('menuitem', {name: 'Aufbewahren', exact: true})).toBeEnabled();
  await page.keyboard.press('Escape');

  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 390, height: 700},
  ]) {
    await page.setViewportSize(viewport);
    await expectBottom(page);
    await page.locator('.result-grid').evaluate((element) => {
      element.scrollTop = 65;
    });
    const prior = await geometry(page);
    const dataset = await openSqlDatasetDialog(page);
    await expect(dataset).toContainText('350 Zeilen');
    await expect(dataset.getByRole('rowheader')).toHaveText(['id', 'wert']);
    await dataset.getByLabel('Datensatzname', {exact: true}).fill('Unbestätigter Entwurf');
    await page.keyboard.press('Escape');
    await expect(dataset).toHaveCount(0);
    const trigger = page.getByRole('button', {name: 'Weitere Ergebnisaktionen', exact: true});
    await expect(trigger).toBeFocused();
    expect(await geometry(page)).toEqual(prior);

    await trigger.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    const details = page.getByRole('dialog', {name: 'Laufdetails', exact: true});
    const title = details.getByRole('heading', {name: 'Laufdetails', exact: true});
    await expect(title).toBeFocused();
    await expect(title).toBeInViewport();
    await page.screenshot({path: info.outputPath(`details-initial-${viewport.width}.png`)});
    await expect(details).toContainText(code);
    await details.getByRole('button', {name: 'Schliessen', exact: true}).focus();
    await page.keyboard.press('Tab');
    const technical = details.locator('.run-technical > summary');
    await expect(technical).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(details.locator('.run-technical')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(details).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await geometry(page)).toEqual(prior);
    expect(await documentOf(page)).toEqual(before);

    await page.getByRole('button', {name: 'Diagramm', exact: true}).click();
    await page.getByLabel('Diagrammtyp').selectOption('scatter');
    await expect(page.locator('canvas[role=img]')).toBeVisible();
    await expectBottom(page);
    await page.getByRole('button', {name: 'Tabelle', exact: true}).click();
    await expectBottom(page);
    await page.screenshot({path: info.outputPath(`result-bottom-${viewport.width}.png`)});
  }
  await page.addStyleTag({content: 'html {font-size: 200%}'});
  await expectBottom(page);
  expect(
    await page.locator('.result-grid').evaluate((element) => element.clientHeight),
  ).toBeGreaterThan(50);
  await page.screenshot({path: info.outputPath('result-bottom-enlarged.png')});
  await page.setViewportSize({width: 1280, height: 800});
  await run(page, 'SELECT 1::INTEGER AS wert WHERE false');
  await expect(page.locator('.result-footer')).toContainText('0 Zeilen');
  await expectBottom(page);
  const empty = await documentOf(page);
  expect(Object.values(empty.runs).at(-1)!.snapshot.code).toBe(
    'SELECT 1::INTEGER AS wert WHERE false',
  );
  await page.reload();
  await expect(page.locator('.result-section').getByRole('alert')).toContainText(
    'Nicht mehr in dieser Sitzung verfügbar',
  );
  await expectBottom(page);
  const unavailable = await openSqlResultActions(page);
  await expect(
    unavailable.getByRole('menuitem', {name: 'Aufbewahren', exact: true}),
  ).toBeDisabled();
  await expect(
    unavailable.getByRole('menuitem', {name: 'Als Datensatz übernehmen …', exact: true}),
  ).toBeDisabled();
  await unavailable.getByRole('menuitem', {name: 'Laufdetails …', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('SELECT 1::INTEGER AS wert WHERE false');
  await page.keyboard.press('Escape');
  await run(page, 'SELECT * FROM unbekannte_tabelle');
  await expect(page.locator('.result-section').getByRole('alert')).toBeVisible();
  await expect(page.locator('.result-grid')).toHaveCount(0);
  const failed = await openSqlRunDetails(page);
  await expect(failed).toContainText('Ausführung fehlgeschlagen');
  await expect(failed).toContainText('SELECT * FROM unbekannte_tabelle');
});

test('SQL result actions: dataset storage failure retains fields and retry saves every row before closing', async ({
  page,
}) => {
  await create(page);
  await run(page, 'SELECT i::INTEGER AS id FROM range(350) t(i)');
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  const before = await documentOf(page);
  const dialog = await openSqlDatasetDialog(page);
  await dialog.getByLabel('Datensatzname', {exact: true}).fill('Gesicherte Messung');
  await dialog.getByLabel('SQL-Name', {exact: true}).fill('messung');
  // Fail the real artifact writer once, before either bytes or metadata are committed.
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const dependencies: unknown = Reflect.get(session.getAnalyses(), 'deps');
    if (!dependencies || typeof dependencies !== 'object')
      throw Error('Analysis dependencies missing');
    const artifacts: unknown = Reflect.get(dependencies, 'artifacts');
    if (!artifacts || typeof artifacts !== 'object') throw Error('Artifact store missing');
    const write: unknown = Reflect.get(artifacts, 'write');
    if (typeof write !== 'function') throw Error('Artifact writer missing');
    Reflect.set(artifacts, 'write', async () => {
      Reflect.set(artifacts, 'write', write);
      throw Error('Test: Resultatdatei kann nicht geschrieben werden');
    });
  });
  await dialog.getByRole('button', {name: 'Als Datensatz speichern', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Resultatdatei kann nicht geschrieben werden',
  );
  await expect(dialog.getByLabel('Datensatzname', {exact: true})).toHaveValue('Gesicherte Messung');
  await expect(dialog.getByLabel('SQL-Name', {exact: true})).toHaveValue('messung');
  expect(await documentOf(page)).toEqual(before);
  await dialog.getByRole('button', {name: 'Als Datensatz speichern', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', {name: 'Weitere Ergebnisaktionen', exact: true}),
  ).toBeFocused();
  const saved = await documentOf(page);
  expect(Object.keys(saved.runs)).toEqual(Object.keys(before.runs));
  expect(Object.values(saved.results)[0]!.retention).toBe('kept');
  expect(Object.values(saved.datasetVersions)[0]!.rowCount).toBe('350');
  await page.reload();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  await run(
    page,
    'SELECT count(*)::INTEGER AS n, min(id) AS erster, max(id) AS letzter FROM data.messung',
  );
  await expect(page.locator('.result-grid tbody td')).toHaveText(['350', '0', '349']);
});

test('SQL result actions: keeping exposes busy state and commits before disabling the action; readers retain details', async ({
  page,
  context,
}) => {
  await create(page);
  await run(page, 'SELECT 17::INTEGER AS wert');
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(1);
  await documentOf(page);
  // Hold one actual Parquet snapshot, then allow the real writer and commit to finish.
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const sql = session.getAnalyses().sql;
    const snapshot = sql.snapshotParquet.bind(sql);
    sql.snapshotParquet = async (...args) => {
      sql.snapshotParquet = snapshot;
      await new Promise<void>((resolve) => Reflect.set(globalThis, '__resumeResultKeep', resolve));
      return snapshot(...args);
    };
  });
  const menu = await openSqlResultActions(page);
  await menu.getByRole('menuitem', {name: 'Aufbewahren', exact: true}).click();
  await expect(
    page.getByRole('status').filter({hasText: /^Resultat wird aufbewahrt …$/}),
  ).toBeVisible();
  await openSqlResultActions(page);
  await expect(
    menu.getByRole('menuitem', {name: 'Resultat wird aufbewahrt …', exact: true}),
  ).toBeDisabled();
  await expect(
    menu.getByRole('menuitem', {name: 'Als Datensatz übernehmen …', exact: true}),
  ).toBeDisabled();
  await expect(menu.getByRole('menuitem', {name: 'Laufdetails …', exact: true})).toBeEnabled();
  await page.evaluate(() => {
    const resume: unknown = Reflect.get(globalThis, '__resumeResultKeep');
    if (typeof resume !== 'function') throw Error('Result keep gate missing');
    resume();
    Reflect.deleteProperty(globalThis, '__resumeResultKeep');
  });
  await expect(menu.getByRole('menuitem', {name: 'Aufbewahren', exact: true})).toBeDisabled();
  await expect(
    menu.getByRole('menuitem', {name: 'Als Datensatz übernehmen …', exact: true}),
  ).toBeEnabled();
  await page.keyboard.press('Escape');
  expect(Object.values((await documentOf(page)).results)[0]!.materialization.kind).toBe('artifact');
  await page.reload();
  await expect(page.locator('.result-grid tbody td')).toHaveText('17');

  const reader = await context.newPage();
  try {
    await reader.goto(page.url());
    await expect(
      reader.getByRole('button', {name: 'Nach R übernehmen', exact: true}),
    ).toBeDisabled();
    const actions = await openSqlResultActions(reader);
    await expect(actions.getByRole('menuitem', {name: 'Aufbewahren', exact: true})).toBeDisabled();
    await expect(
      actions.getByRole('menuitem', {name: 'Als Datensatz übernehmen …', exact: true}),
    ).toBeDisabled();
    await actions.getByRole('menuitem', {name: 'Laufdetails …', exact: true}).click();
    await expect(reader.getByRole('dialog', {name: 'Laufdetails', exact: true})).toContainText(
      'SELECT 17::INTEGER AS wert',
    );
  } finally {
    await reader.close();
  }
});

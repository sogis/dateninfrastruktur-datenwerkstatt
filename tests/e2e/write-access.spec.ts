import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {test, expect} from '../persistentBrowser';

const retryName = 'Schreibrecht erneut anfordern';
const heldText = 'Das Schreibrecht ist weiterhin belegt.';
const successText = 'Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.';

async function createProject(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Schreibzugriff prüfen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(
    page.getByRole('heading', {name: 'Schreibzugriff prüfen', exact: true}),
  ).toBeVisible();
  return page.url();
}

async function sessionSnapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    return {
      sessionId: session.sessionId,
      readOnly: session.readOnly,
      document: session.document,
    };
  });
}

async function readerFor(page: Page, reader: Page, url: string) {
  await reader.goto(url);
  await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  await expect(reader.getByRole('button', {name: retryName, exact: true})).toBeEnabled();
  expect((await sessionSnapshot(page)).readOnly).toBe(false);
  expect((await sessionSnapshot(reader)).readOnly).toBe(true);
}

async function deferRetry(page: Page) {
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const original = services.workspaces.reacquire.bind(services.workspaces);
    let calls = 0;
    Reflect.set(globalThis, '__writeAccessRetryCalls', () => calls);
    services.workspaces.reacquire = (..._args: Parameters<typeof original>) => {
      calls++;
      return new Promise((_resolve, reject) => {
        Reflect.set(globalThis, '__rejectWriteAccessRetry', () =>
          reject(Error('Gezielter Fehler bei der Schreibrechtsprüfung')),
        );
      });
    };
    Reflect.set(globalThis, '__restoreWriteAccessRetry', () => {
      services.workspaces.reacquire = original;
    });
  });
}

async function rejectRetry(page: Page) {
  await page.evaluate(() => {
    const reject: unknown = Reflect.get(globalThis, '__rejectWriteAccessRetry');
    const restore: unknown = Reflect.get(globalThis, '__restoreWriteAccessRetry');
    if (typeof reject !== 'function' || typeof restore !== 'function')
      throw Error('The deferred retry is missing.');
    restore();
    reject();
  });
}

for (const kind of ['sql', 'r'] as const) {
  test(`AT-012: held retry keeps the ${kind.toUpperCase()} reader view and keyboard promotion loads the latest project`, async ({
    page,
    context,
  }) => {
    const projectUrl = await createProject(page);
    const analysisId = await page.evaluate(async (kind) => {
      const path = '/tests/spike/appServices.ts';
      const {services} = (await import(path)) as typeof import('../spike/appServices');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      const id = session.createAnalysis(kind);
      session.updateAnalysis(id, {
        name: 'Gesicherte Analyse',
        code: kind === 'sql' ? 'SELECT 7 AS wert;' : 'wert <- 7',
      });
      await session.flush();
      return id;
    }, kind);
    const url = `${projectUrl}/${kind}/${analysisId}`;
    const reader = await context.newPage();
    const editControl =
      kind === 'sql'
        ? reader.getByRole('button', {name: 'Version speichern', exact: true})
        : reader.getByLabel('Analysename', {exact: true});
    await readerFor(page, reader, url);
    await expect(reader.locator('.monaco-editor')).toBeVisible();
    await reader
      .getByRole('navigation', {name: 'Hauptnavigation'})
      .getByRole('button', {name: 'Navigation ausklappen', exact: true})
      .click();
    await expect(reader.locator('.sidebar')).toHaveCSS('width', '212px');
    const before = await sessionSnapshot(reader);
    const retry = reader.getByRole('button', {name: retryName, exact: true});
    await retry.focus();
    await retry.press('Enter');
    await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
    await expect(reader.locator('.workspace-write-access-status')).toHaveAttribute(
      'role',
      'status',
    );
    await expect(reader.locator('.workspace-write-access-status')).toHaveAttribute(
      'aria-atomic',
      'true',
    );
    await expect(retry).toBeEnabled();
    await expect(retry).toBeFocused();
    expect(reader.url()).toBe(url);
    expect(await sessionSnapshot(reader)).toEqual(before);
    await expect(reader.locator('.sidebar')).toHaveCSS('width', '212px');
    await expect(editControl).toBeDisabled();
    await expect(reader.getByRole('button', {name: 'Ausführen', exact: true})).toBeDisabled();
    await page.getByLabel('Beschreibung', {exact: true}).fill('Neuester gespeicherter Stand');
    await page.getByRole('button', {name: 'Speichern', exact: true}).click();
    await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
    await page.close();
    await reader.clock.install();
    await reader.clock.pauseAt(await reader.evaluate(() => Date.now() + 1000));
    await retry.focus();
    await retry.press('Space');
    const success = reader.getByText(successText, {exact: true});
    await expect(success).toBeVisible();
    await expect(success).toBeFocused();
    await expect(reader.getByRole('button', {name: retryName, exact: true})).toHaveCount(0);
    expect(reader.url()).toBe(url);
    await expect(editControl).toBeEnabled();
    await expect(reader.locator('.sidebar')).toHaveCSS('width', '212px');
    const after = await sessionSnapshot(reader);
    expect(after.readOnly).toBe(false);
    expect(after.sessionId).not.toBe(before.sessionId);
    expect(after.document.workspace.description).toBe('Neuester gespeicherter Stand');
    expect(after.document.analyses[analysisId]?.code).toBe(
      before.document.analyses[analysisId]?.code,
    );
    expect(Object.keys(after.document.runs)).toHaveLength(0);
    await reader.clock.fastForward(2999);
    await expect(success).toBeVisible();
    await reader.clock.fastForward(1);
    await expect(success).toHaveCount(0);
  });
}

test('AT-012: a single tab retains write access across page reloads', async ({page, context}) => {
  const url = await createProject(page);
  await page.getByLabel('Beschreibung', {exact: true}).fill('Nach Neuladen schreibbar');
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
  expect(context.pages().filter((item) => !item.isClosed())).toHaveLength(1);
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.reload();
    await expect(page.getByLabel('Beschreibung', {exact: true})).toBeEnabled();
    await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
      'Nach Neuladen schreibbar',
    );
    await expect(page.getByRole('button', {name: retryName, exact: true})).toHaveCount(0);
    expect(page.url()).toBe(url);
    expect((await sessionSnapshot(page)).readOnly).toBe(false);
  }
});

test('AT-012: delayed successful promotion preserves focus intentionally moved to the sidebar', async ({
  page,
  context,
}) => {
  const projectUrl = await createProject(page);
  const analysisId = await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const id = session.createAnalysis('sql');
    session.updateAnalysis(id, {name: 'Fokus erhalten', code: 'SELECT 9 AS wert;'});
    await session.flush();
    return id;
  });
  const url = `${projectUrl}/sql/${analysisId}`;
  const reader = await context.newPage();
  await readerFor(page, reader, url);
  await expect(reader.locator('.monaco-editor')).toBeVisible();
  await reader.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const original = services.workspaces.reacquire.bind(services.workspaces);
    const gate = new Promise<void>((resolve) => {
      Reflect.set(globalThis, '__allowWriteAccessPromotion', resolve);
    });
    services.workspaces.reacquire = async (...args: Parameters<typeof original>) => {
      await gate;
      return original(...args);
    };
  });
  const retry = reader.getByRole('button', {name: retryName, exact: true});
  await retry.focus();
  await retry.press('Enter');
  await expect(
    reader.getByRole('button', {name: 'Schreibrecht wird geprüft …', exact: true}),
  ).toBeDisabled();
  await page.close();
  await reader.keyboard.press('Tab');
  const settings = reader
    .getByRole('navigation', {name: 'Hauptnavigation'})
    .getByRole('link', {name: 'Einstellungen', exact: true});
  await settings.focus();
  await expect(settings).toBeFocused();
  await reader.evaluate(() => {
    const allow: unknown = Reflect.get(globalThis, '__allowWriteAccessPromotion');
    if (typeof allow !== 'function') throw Error('The delayed promotion gate is missing.');
    allow();
  });
  await expect(reader.getByText(successText, {exact: true})).toBeVisible();
  await expect(reader.getByRole('button', {name: 'Version speichern', exact: true})).toBeEnabled();
  await expect(reader.locator('.monaco-editor')).toBeVisible();
  expect((await sessionSnapshot(reader)).readOnly).toBe(false);
  await expect(settings).toBeFocused();
  await expect(reader.locator('.workspace-write-access-status')).not.toBeFocused();
  expect(reader.url()).toBe(url);
});

test('AT-012: pending retry prevents duplicate activation and a technical failure keeps the reader usable', async ({
  page,
  context,
}) => {
  const url = await createProject(page);
  const reader = await context.newPage();
  await readerFor(page, reader, url);
  const before = await sessionSnapshot(reader);
  await deferRetry(reader);
  const retry = reader.getByRole('button', {name: retryName, exact: true});
  await retry.click();
  const pending = reader.getByRole('button', {name: 'Schreibrecht wird geprüft …', exact: true});
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  await pending.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  const calls = await reader.evaluate(() => {
    const count: unknown = Reflect.get(globalThis, '__writeAccessRetryCalls');
    if (typeof count !== 'function') throw Error('Retry counter is missing.');
    return count();
  });
  expect(calls).toBe(1);
  await rejectRetry(reader);
  const error = reader.locator('.workspace-write-access .dw-notice.dw-tone-danger');
  await expect(error).toBeVisible();
  await error.locator('summary').filter({hasText: 'Technische Details'}).click();
  await expect(error.getByText(/Gezielter Fehler bei der Schreibrechtsprüfung/)).toBeVisible();
  await expect(retry).toBeEnabled();
  expect(await sessionSnapshot(reader)).toEqual(before);
  await expect(reader.getByLabel('Beschreibung', {exact: true})).toBeDisabled();
  await expect(
    reader.getByRole('button', {name: 'Projekt exportieren', exact: true}),
  ).toBeEnabled();
  await retry.click();
  await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
});

test('AT-012: diagnostics update after a held retry and download only structured write-access facts', async ({
  page,
  context,
}) => {
  const url = await createProject(page);
  await page.getByLabel('Beschreibung', {exact: true}).fill('Private Beschreibung ohne Bericht');
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
  const reader = await context.newPage();
  await readerFor(page, reader, `${url}/diagnostics`);
  const technical = reader.locator('.diagnostics-technical');
  await technical.locator('summary').click();
  await expect(technical).toContainText('Noch nicht angefordert');
  await reader.getByRole('button', {name: retryName, exact: true}).click();
  await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  await expect(technical).toContainText('Schreibrecht weiterhin belegt');
  await expect(technical).toContainText('Das Schreibrecht ist bereits belegt.');
  await expect(technical).toContainText('Verfügbar');
  await expect(technical.locator('time')).toHaveAttribute(
    'datetime',
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/,
  );
  // A raw technical error remains local UI feedback; it must not enter the report.
  await deferRetry(reader);
  await reader.getByRole('button', {name: retryName, exact: true}).click();
  await rejectRetry(reader);
  await expect(reader.locator('.workspace-write-access .dw-notice.dw-tone-danger')).toBeVisible();
  const downloading = reader.waitForEvent('download');
  await reader.getByRole('button', {name: 'Diagnosebericht herunterladen', exact: true}).click();
  const download = await downloading;
  expect(await download.failure()).toBeNull();
  const file = await download.path();
  if (!file) throw Error('The diagnostic download is missing.');
  const text = await readFile(file, 'utf8');
  const report: unknown = JSON.parse(text);
  expect(report).toMatchObject({
    readOnly: true,
    writeAccess: {
      reason: 'lock-held',
      webLocksAvailable: true,
      lastAttempt: {outcome: 'still-held', at: expect.any(String)},
    },
  });
  expect(text).not.toContain('Gezielter Fehler bei der Schreibrechtsprüfung');
  expect(text).not.toContain('Private Beschreibung ohne Bericht');
  expect(report).not.toHaveProperty('analyses');
});

test('AT-012: a delayed retry failure after navigation does not appear in another project', async ({
  page,
  context,
}) => {
  const url = await createProject(page);
  const reader = await context.newPage();
  await readerFor(page, reader, url);
  await deferRetry(reader);
  await reader.getByRole('button', {name: retryName, exact: true}).click();
  await expect(
    reader.getByRole('button', {name: 'Schreibrecht wird geprüft …', exact: true}),
  ).toBeDisabled();
  await reader
    .getByRole('navigation', {name: 'Hauptnavigation'})
    .getByRole('link', {name: 'Projekte', exact: true})
    .click();
  await expect(reader).toHaveURL(/\/projects$/);
  await reader.getByLabel('Name des neuen Projekts').fill('Anderes Projekt');
  await reader.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(reader.getByRole('heading', {name: 'Anderes Projekt', exact: true})).toBeVisible();
  await rejectRetry(reader);
  await expect(reader.locator('.app-error')).toHaveCount(0);
  await expect(reader.getByText(/Gezielter Fehler bei der Schreibrechtsprüfung/)).toHaveCount(0);
  await expect(reader.getByLabel('Beschreibung', {exact: true})).toBeEnabled();
  expect(reader.url()).not.toBe(url);
});

test('AT-055: write-access reason, retry and result fit narrow widths and 200% text', async ({
  page,
  context,
}, info) => {
  const url = await createProject(page);
  const reader = await context.newPage();
  await readerFor(page, reader, url);
  const retry = reader.getByRole('button', {name: retryName, exact: true});
  await retry.click();
  await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  for (const width of [390, 1280, 1440]) {
    await reader.setViewportSize({width, height: 900});
    await retry.scrollIntoViewIfNeeded();
    await expect(retry).toBeInViewport();
    const bounds = await retry.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(40);
    expect(bounds?.height).toBeGreaterThanOrEqual(40);
    expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await reader.screenshot({path: info.outputPath(`write-access-${width}.png`), fullPage: true});
  }
  await reader.addStyleTag({content: 'html { font-size: 200%; }'});
  await reader.setViewportSize({width: 390, height: 900});
  await retry.scrollIntoViewIfNeeded();
  await expect(retry).toBeInViewport();
  expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await retry.focus();
  await retry.press('Enter');
  await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  await reader.screenshot({path: info.outputPath('write-access-390-text-200.png'), fullPage: true});
});

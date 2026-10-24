import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function create(page: Page) {
  await page.goto('/projects');
  await expect(page.getByRole('link', {name: 'Diagnose', exact: true})).toHaveCount(0);
  await page.getByLabel('Name des neuen Projekts').fill('Sitzung und Diagnose');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Sitzung und Diagnose'})).toBeVisible();
}
async function enter(page: Page, code: string) {
  await page.locator('.monaco-editor').click();
  const editor = page.getByRole('textbox', {name: 'Analysecode'});
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(code);
  await editor.press('ControlOrMeta+s');
}
async function sessionOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    await session.flush();
    return {
      id: session.sessionId,
      document: session.document,
      scope: session.getR().scope,
      epoch: session.getR().epoch,
    };
  });
}

test('Settings feedback: silent entry, grouped options, three-second confirmation and real persistence', async ({
  page,
}, info) => {
  await page.goto('/settings');
  const status = page.locator('.settings-save-status');
  await expect(status).toHaveText('');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(page.locator('.settings-page > .dw-notice')).toHaveCount(0);
  await expect(page.locator('.settings-page > .form-fields > .dw-field')).toHaveCount(4);
  const top = (await page.getByRole('heading', {name: 'Browser-Speicher'}).boundingBox())!.y;
  const height = (await status.boundingBox())!.height;
  expect(height).toBeGreaterThanOrEqual(20);
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  await expect(status).toHaveText('Einstellungen gespeichert');
  expect((await page.getByRole('heading', {name: 'Browser-Speicher'}).boundingBox())!.y).toBe(top);
  expect((await status.boundingBox())!.height).toBe(height);
  await page.clock.fastForward(2999);
  await expect(status).toHaveText('Einstellungen gespeichert');
  await page.clock.fastForward(1);
  await expect(status).toHaveText('');
  await page.reload();
  await expect(page.getByLabel('Editor-Schriftgrösse')).toHaveValue('18');
  await expect(status).toHaveText('');
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 390, height: 700},
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`settings-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({width: 1280, height: 650});
  await page.addStyleTag({content: 'html {font-size: 200%}'});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('settings-text-200.png'), fullPage: true});
});

test('Settings feedback: latest response wins, failure persists and navigation clears timers and pending feedback', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    type Settings = Awaited<ReturnType<typeof services.settings.load>>;
    const calls: {resolve(): void; reject(): void}[] = [];
    services.settings.save = (value: Settings) =>
      new Promise<Settings>((resolve, reject) => {
        calls.push({
          resolve: () => resolve(value),
          reject: () => reject(Error('Gezielter Speicherfehler')),
        });
      });
    Reflect.set(globalThis, '__settingsFeedbackProbe', calls);
  });
  const settle = (index: number, fail = false) =>
    page.evaluate(
      ({index, fail}) => {
        const calls: unknown = Reflect.get(globalThis, '__settingsFeedbackProbe');
        if (!Array.isArray(calls)) throw Error('Save probe missing');
        const call: unknown = calls[index];
        if (!call || typeof call !== 'object') throw Error('Save call missing');
        const fn: unknown = Reflect.get(call, fail ? 'reject' : 'resolve');
        if (typeof fn !== 'function') throw Error('Save callback missing');
        fn();
      },
      {index, fail},
    );
  const status = page.locator('.settings-save-status');
  const font = page.getByLabel('Editor-Schriftgrösse');
  await font.selectOption('16');
  await font.selectOption('18');
  await settle(0, true);
  await expect(status).toHaveText('Einstellungen werden gespeichert …');
  await expect(page.locator('.app-error')).toHaveCount(0);
  await settle(1);
  await expect(status).toHaveText('Einstellungen gespeichert');
  await page.clock.fastForward(1000);
  await font.selectOption('19');
  await page.clock.fastForward(4000);
  await expect(status).toHaveText('Einstellungen werden gespeichert …');
  await settle(2, true);
  await expect(status).toHaveText('Speichern fehlgeschlagen');
  await expect(page.locator('.app-error')).toContainText('Gezielter Speicherfehler');
  await page.clock.fastForward(6000);
  await expect(status).toHaveText('Speichern fehlgeschlagen');
  await page.getByRole('button', {name: 'Hinweis schliessen'}).click();
  await font.selectOption('20');
  await page.getByRole('link', {name: 'Projekte', exact: true}).click();
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await expect(status).toHaveText('');
  await font.selectOption('21');
  await settle(4);
  await expect(status).toHaveText('Einstellungen gespeichert');
  await settle(3, true);
  await expect(status).toHaveText('Einstellungen gespeichert');
  await expect(page.locator('.app-error')).toHaveCount(0);
  await page.getByRole('link', {name: 'Projekte', exact: true}).click();
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await page.clock.fastForward(4000);
  await expect(status).toHaveText('');
});

test('Project diagnostics: real SQL/R session, report compatibility, live operations, navigation and layout', async ({
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
  await create(page);
  const overview = page.url();
  const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  const labels = await nav
    .locator('.dw-nav-item')
    .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')));
  expect(labels.slice(-2)).toEqual(['Einstellungen', 'Diagnose']);
  await expect(page.getByText('Lokale Diagnose', {exact: true})).toHaveCount(0);
  await expect(page.locator('.archive-actions')).not.toContainText('Inventarprüfung');
  await page.getByRole('button', {name: 'Projektaktionen', exact: true}).click();
  await expect(page.getByRole('menuitem', {name: 'Integrität prüfen'})).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  const sqlUrl = page.url();
  await enter(page, 'SELECT 42 AS original_sql');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('42');
  await page.getByRole('button', {name: 'R', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
    timeout: 60000,
  });
  await enter(page, 'original <- data.frame(value=c(1L,2L)); cat("PRIVATE_DIAGNOSTICS_CODE")');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(
    page.getByRole('button', {name: 'original 2 Zeilen, 1 Spalte', exact: true}),
  ).toBeEnabled();
  const before = await sessionOf(page);
  const count = workers.length;
  const diagnostics = nav.getByRole('link', {name: 'Diagnose', exact: true});
  await page.keyboard.press('Tab');
  await diagnostics.focus();
  await expect(page.getByRole('tooltip', {name: 'Diagnose', exact: true})).toBeVisible();
  await diagnostics.press('Enter');
  await expect(page).toHaveURL(`${overview}/diagnostics`);
  await expect(diagnostics).toHaveAttribute('aria-current', 'page');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.diagnostics-technical')).not.toHaveAttribute('open');
  await expect(page.getByText(before.id, {exact: true})).not.toBeVisible();
  expect(await sessionOf(page)).toEqual(before);
  expect(workers).toHaveLength(count);
  expect(workers.every((worker) => !worker.closed)).toBe(true);
  await page.getByRole('button', {name: 'Integrität prüfen', exact: true}).click();
  await expect(page.locator('.diagnostics-check-status')).toHaveText(
    'Die Dateiprüfung ist abgeschlossen.',
  );
  expect((await sessionOf(page)).document).toEqual(before.document);
  for (const includeCode of [false, true]) {
    await page.getByLabel('Analysecode in den Bericht aufnehmen').setChecked(includeCode);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Diagnosebericht herunterladen'}).click();
    const bytes = await readFile((await (await pending).path())!, 'utf8');
    const data: unknown = JSON.parse(bytes);
    expect(data).toMatchObject({
      formatVersion: 1,
      workspaceId: before.document.workspace.id,
      sessionId: before.id,
      revision: before.document.revision,
      writeAccess: {reason: null, webLocksAvailable: true, lastAttempt: null},
      runs: Object.values(before.document.runs).map((run) => ({
        id: run.id,
        status: run.status,
        durationMs: run.durationMs,
        runtime: run.snapshot.runtime,
      })),
      counts: {
        datasets: Object.keys(before.document.datasets).length,
        runs: Object.keys(before.document.runs).length,
        results: Object.keys(before.document.results).length,
      },
    });
    const expectedKeys = [
      'formatVersion',
      'createdAt',
      'buildId',
      'workspaceId',
      'sessionId',
      'revision',
      'mode',
      'readOnly',
      'writeAccess',
      'counts',
      'runs',
      'timings',
      ...(includeCode ? ['analyses'] : []),
    ];
    expect(Object.keys(data as object).sort()).toEqual(expectedKeys.sort());
    expect(bytes.includes('PRIVATE_DIAGNOSTICS_CODE')).toBe(includeCode);
  }
  await page.getByText('Technische Details', {exact: true}).click();
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 390, height: 700},
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(`diagnostics-${viewport.width}.png`),
      fullPage: true,
    });
  }
  const enlarged = await page.addStyleTag({content: 'html {font-size: 200%}'});
  await page.setViewportSize({width: 1280, height: 650});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('diagnostics-text-200.png'), fullPage: true});
  await enlarged.evaluate((style) => style.parentNode?.removeChild(style));
  await page.setViewportSize({width: 1440, height: 900});
  await page.getByRole('button', {name: 'R', exact: true}).click();
  await expect(
    page.getByRole('button', {name: 'original 2 Zeilen, 1 Spalte', exact: true}),
  ).toBeEnabled();
  expect(await sessionOf(page)).toEqual(before);
  await page.getByRole('button', {name: 'SQL', exact: true}).click();
  await expect(page).toHaveURL(sqlUrl);
  await expect(page.locator('.view-lines')).toContainText('original_sql');
  await enter(page, 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.run-summary-message')).toHaveText('Ausführung läuft');
  await diagnostics.click();
  const report = page.getByRole('region', {name: 'Diagnosebericht', exact: true});
  await expect(report.getByRole('status')).toHaveText('Aktueller Vorgang: SQL ausführen.');
  await expect(page.getByRole('button', {name: 'Integrität prüfen', exact: true})).toBeDisabled();
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.getAnalyses().cancel();
  });
  await expect(report.getByRole('status')).toHaveText('Die Sitzung ist bereit.');
  await expect(page.getByRole('button', {name: 'Integrität prüfen', exact: true})).toBeEnabled();
  expect((await sessionOf(page)).id).toBe(before.id);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Diagnose', exact: true})).toBeVisible();
  await expect(diagnostics).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel('Analysecode in den Bericht aufnehmen')).not.toBeChecked();
  await expect(page.locator('.diagnostics-technical')).not.toHaveAttribute('open');
});

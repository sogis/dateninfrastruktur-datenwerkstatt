import type {Page} from '@playwright/test';
import {test, expect} from '../persistentBrowser';
import {portalConfig} from '../portal/setup';

async function createProject(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Aktionsrückmeldungen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(
    page.getByRole('heading', {name: 'Aktionsrückmeldungen', exact: true}),
  ).toBeVisible();
}

async function exportArchive(page: Page, recipe = false) {
  await page.getByRole('button', {name: 'Projekt exportieren', exact: true}).click();
  if (recipe) await page.getByLabel('Archivmodus').selectOption('recipe');
  const download = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Archiv herunterladen', exact: true}).click();
  expect(await (await download).failure()).toBeNull();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('Action feedback: complete archive uses plain three-second confirmation and repeated exports restart it', async ({
  page,
}, info) => {
  await createProject(page);
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await exportArchive(page);
  const status = page.locator('.archive-actions .dw-action-status');
  await expect(status).toHaveText('Archiv mit sämtlichen gespeicherten Datenständen exportiert.');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-atomic', 'true');
  await expect(page.locator('.archive-actions .dw-notice')).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('archive-complete-confirmation.png'),
    fullPage: true,
  });
  await page.clock.fastForward(2999);
  await expect(status).toContainText('exportiert.');
  await page.clock.fastForward(1);
  await expect(status).toHaveText('');
  await exportArchive(page);
  await page.clock.fastForward(2000);
  await exportArchive(page);
  await page.clock.fastForward(2999);
  await expect(status).toContainText('exportiert.');
  await page.clock.fastForward(1);
  await expect(status).toHaveText('');
});

test('Action feedback: recipe omissions persist, can be dismissed by pointer and keyboard and recur on export', async ({
  page,
  browserName,
}, info) => {
  await page.goto('/projects');
  await page.getByLabel('Projektdatei importieren').setInputFiles('fixtures/sample.dwproj');
  await page.getByRole('button', {name: 'Als neues Projekt importieren', exact: true}).click();
  const action = page.getByRole('button', {name: 'Projekt exportieren', exact: true});
  await expect(action).toBeVisible();
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await exportArchive(page, true);
  const notice = page.locator('.archive-actions .dw-notice').filter({hasText: 'Auslassungen.'});
  const close = notice.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  await expect(notice).toHaveClass(/dw-tone-info/);
  await expect(notice).toHaveAttribute('role', 'status');
  await page.clock.fastForward(10_000);
  await expect(notice).toBeVisible();
  await page.screenshot({path: info.outputPath('archive-omissions-notice.png'), fullPage: true});
  await close.hover();
  await page.clock.fastForward(250);
  await expect(page.getByRole('tooltip', {name: 'Hinweis schliessen', exact: true})).toBeVisible();
  await close.click();
  await expect(notice).toHaveCount(0);
  await expect(action).toBeFocused();
  await exportArchive(page, true);
  await expect(notice).toBeVisible();
  // Stay in the document: Tab after the final button can enter browser chrome,
  // whose reverse traversal differs between Firefox, WebKit and Chromium.
  await page
    .locator('.archive-actions .dw-notice.dw-tone-danger')
    .getByRole('link', {name: 'Diagnose', exact: true})
    .focus();
  const optionTab = browserName === 'webkit' && process.platform === 'darwin';
  await page.keyboard.press(optionTab ? 'Alt+Tab' : 'Tab');
  await expect(close).toBeFocused();
  expect(await close.evaluate((button) => button.matches(':focus-visible'))).toBe(true);
  const outline = await close.evaluate((button) => getComputedStyle(button).outlineStyle);
  expect(outline).not.toBe('none');
  await close.press('Enter');
  await expect(notice).toHaveCount(0);
  await expect(action).toBeFocused();
  await exportArchive(page, true);
  await close.press('Space');
  await expect(notice).toHaveCount(0);
  await expect(action).toBeFocused();
  // Dismissing the action report must not hide the ongoing missing-data state.
  await expect(page.locator('.archive-actions .dw-notice.dw-tone-danger')).toContainText(
    'Betroffene Daten sind nicht verfügbar.',
  );
});

test('Action feedback: an export rejection after leaving the project does not leak into the next view', async ({
  page,
}) => {
  await createProject(page);
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.exportArchive = () =>
      new Promise((_, reject) => {
        Reflect.set(globalThis, '__rejectLateArchiveFeedback', () =>
          reject(Error('Verspäteter Exportfehler aus der verlassenen Ansicht')),
        );
      });
  });
  await page.getByRole('button', {name: 'Projekt exportieren', exact: true}).click();
  await page.getByRole('button', {name: 'Archiv herunterladen', exact: true}).click();
  await expect(
    page.getByRole('button', {name: 'Archiv wird erstellt …', exact: true}),
  ).toBeDisabled();
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await page.evaluate(() => {
    const reject: unknown = Reflect.get(globalThis, '__rejectLateArchiveFeedback');
    if (typeof reject !== 'function') throw Error('Pending archive rejection probe missing');
    reject();
  });
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Einstellungen', exact: true})).toBeVisible();
  await expect(page.locator('.app-error')).toHaveCount(0);
});

test('Action feedback: multiline import errors retain details, retry state, target size and layout', async ({
  page,
}, info) => {
  await createProject(page);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  const originalError =
    'Die Vorschau konnte nicht geladen werden. Die gewählten CSV-Einstellungen passen nicht zu dieser Datei; kontrolliere das Trennzeichen und die Spaltentypen.\n' +
    'Originaldiagnose: Der Wert «unbekannt» kann in Zeile 2, Spalte «Anzahl der verfügbaren Fahrzeuge» nicht als BIGINT gelesen werden.';
  // Inject only the failing port response: this test verifies feedback, not engine parsing.
  await page.evaluate(async (message) => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.getDatasets().preview = async () => {
      throw Error(message);
    };
  }, originalError);
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Datei importieren', exact: true});
  await dialog.locator('input[type=file]').setInputFiles('fixtures/gemeinden.csv');
  const preview = dialog.getByRole('button', {name: 'Vorschau laden', exact: true});
  const confirm = dialog.getByRole('button', {name: 'Import bestätigen', exact: true});
  await preview.click();
  const notice = dialog.getByRole('alert').filter({hasText: 'Originaldiagnose:'});
  const close = notice.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  await expect(notice).toContainText('Der Wert «unbekannt»');
  expect(await notice.textContent()).toContain(originalError);
  await expect(confirm).toBeDisabled();
  for (const width of [390, 1280, 1440]) {
    await page.setViewportSize({width, height: 900});
    await close.scrollIntoViewIfNeeded();
    const target = (await close.boundingBox())!;
    const panel = (await notice.boundingBox())!;
    expect(target.width).toBeGreaterThanOrEqual(40);
    expect(target.height).toBeGreaterThanOrEqual(40);
    expect(Math.abs(target.y + target.height / 2 - panel.y - panel.height / 2)).toBeLessThan(2);
    expect(target.x).toBeGreaterThanOrEqual(panel.x);
    expect(target.x + target.width).toBeLessThanOrEqual(panel.x + panel.width);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({path: info.outputPath(`feedback-${width}.png`), fullPage: true});
  }
  await page.addStyleTag({content: 'html { font-size: 200%; }'});
  await close.scrollIntoViewIfNeeded();
  await expect(close).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('feedback-text-200.png'), fullPage: true});
  await close.click();
  await expect(notice).toHaveCount(0);
  await expect(preview).toBeFocused();
  await expect(confirm).toBeDisabled();
  await preview.click();
  await expect(notice).toBeVisible();
  expect(await notice.textContent()).toContain(originalError);
  await expect(confirm).toBeDisabled();
});

test('Action feedback: dismissing a parameter-apply error preserves edited values and retry reports it again', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.getByText('Parameter (0)', {exact: true}).click();
  await page.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  const name = page.getByLabel('Parameter 1 Name', {exact: true});
  const value = page.getByLabel('Parameter 1 Wert', {exact: true});
  await name.fill('jahr');
  await value.fill('2026');
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const update = session.updateAnalysis.bind(session);
    session.updateAnalysis = (id, patch) => {
      if (patch.parameters) throw Error('Gezielter Fehler bei der Parameterübernahme');
      return update(id, patch);
    };
  });
  const apply = page.getByRole('button', {name: 'Parameter übernehmen', exact: true});
  await apply.click();
  const notice = page.locator('.parameters').getByRole('alert');
  await expect(notice).toContainText('Gezielter Fehler bei der Parameterübernahme');
  await notice.getByRole('button', {name: 'Hinweis schliessen', exact: true}).click();
  await expect(notice).toHaveCount(0);
  await expect(apply).toBeFocused();
  await expect(name).toHaveValue('jahr');
  await expect(value).toHaveValue('2026');
  await expect(page.locator('.parameters summary')).toContainText('Parameter (0)');
  await apply.click();
  await expect(notice).toContainText('Gezielter Fehler bei der Parameterübernahme');
  await name.fill('');
  await apply.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.parameters .dw-notice')).toHaveCount(0);
  await expect(page.locator('.parameters .dw-field-error')).toBeVisible();
  await expect(page.locator('.parameters .dw-field-error button')).toHaveCount(0);
});

test('Action feedback: a changed CSV option returns dismissal focus to preview when the failed confirm action is disabled', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Datei importieren', exact: true});
  await dialog.locator('input[type=file]').setInputFiles('fixtures/gemeinden.csv');
  const preview = dialog.getByRole('button', {name: 'Vorschau laden', exact: true});
  const confirm = dialog.getByRole('button', {name: 'Import bestätigen', exact: true});
  await preview.click();
  await expect(dialog.getByRole('cell', {name: 'Auenried', exact: true})).toBeVisible();
  await expect(confirm).toBeEnabled();
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.getDatasets().confirm = async () => {
      throw Error('Gezielter Fehler beim Bestätigen des Dateiimports');
    };
  });
  await confirm.click();
  const notice = dialog.getByRole('alert').filter({hasText: 'Gezielter Fehler beim Bestätigen'});
  await expect(notice).toBeVisible();
  await expect(confirm).toBeEnabled();
  const delimiter = dialog.getByLabel('Trennzeichen', {exact: true});
  await delimiter.selectOption(',');
  await expect(confirm).toBeDisabled();
  await notice.getByRole('button', {name: 'Hinweis schliessen', exact: true}).click();
  await expect(notice).toHaveCount(0);
  await expect(preview).toBeFocused();
  await expect(confirm).toBeDisabled();
  await expect(delimiter).toHaveValue(',');
});

test('Action feedback: transfer errors dismiss without creating a plan and retry retains the original error', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  const code = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await code.press('ControlOrMeta+a');
  await page.keyboard.insertText('SELECT 1::INTEGER AS id');
  await code.press('ControlOrMeta+Enter');
  await expect(page.locator('.result-grid tbody td')).toHaveText('1');
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    session.getR().planToR = async () => {
      throw Error('Gezielter Fehler bei der Transferprüfung');
    };
  });
  await page.getByRole('button', {name: 'In R', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'Resultat in R übernehmen', exact: true});
  const check = dialog.getByRole('button', {name: 'Transfer prüfen', exact: true});
  await check.click();
  const notice = dialog.getByRole('alert');
  await expect(notice).toContainText('Gezielter Fehler bei der Transferprüfung');
  await notice.getByRole('button', {name: 'Hinweis schliessen', exact: true}).click();
  await expect(notice).toHaveCount(0);
  await expect(check).toBeFocused();
  await expect(dialog.getByLabel('R-Variablenname', {exact: true})).toHaveValue('daten');
  await expect(dialog.getByRole('button', {name: 'In R übernehmen', exact: true})).toHaveCount(0);
  await check.click();
  await expect(notice).toContainText('Gezielter Fehler bei der Transferprüfung');
});

test('Action feedback: portal load errors dismiss and retry without changing the selected provider or input', async ({
  page,
}) => {
  await page.route('**/runtime-config.json', (route) => route.fulfill({json: portalConfig}));
  await page.route('http://127.0.0.1:4174/portal/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      headers: {'Access-Control-Allow-Origin': '*'},
      body: '{}',
    }),
  );
  await createProject(page);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Aus Portal hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog');
  const provider = dialog.getByLabel('Portal', {exact: true});
  const value = dialog.getByLabel('Dataset-ID oder Portal-URL', {exact: true});
  await provider.selectOption('direct');
  await value.fill('messung');
  const load = dialog.getByRole('button', {name: 'Kontext laden', exact: true});
  await load.click();
  const notice = dialog.getByRole('alert').filter({hasText: 'Portal: HTTP 503.'});
  await expect(notice).toBeVisible();
  await notice.getByRole('button', {name: 'Hinweis schliessen', exact: true}).click();
  await expect(notice).toHaveCount(0);
  await expect(load).toBeFocused();
  await expect(provider).toHaveValue('direct');
  await expect(value).toHaveValue('messung');
  await expect(
    dialog.getByRole('button', {name: 'Portalimport bestätigen', exact: true}),
  ).toHaveCount(0);
  await load.click();
  await expect(notice).toBeVisible();
});

test('Action feedback: storage cleanup success expires and partial failures preserve summary and original details', async ({
  page,
}) => {
  await page.goto('/settings');
  const storage = page.getByRole('region', {name: 'Browser-Speicher', exact: true});
  const manage = storage.getByRole('button', {name: 'Speicher verwalten', exact: true});
  await expect(manage).toBeVisible();
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const clean = async () => {
    await manage.click();
    await page
      .getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen', exact: true})
      .click();
    await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  await clean();
  const status = storage.locator('.dw-action-status');
  await expect(status).toHaveText('Es wurden keine Dateien bereinigt.');
  await page.clock.fastForward(2999);
  await expect(status).toHaveText('Es wurden keine Dateien bereinigt.');
  await page.clock.fastForward(1);
  await expect(status).toHaveCount(0);
  const failures = [
    'workspaces/probe/artifacts/datei-1: NotAllowedError: Zugriff durch den Browser verweigert',
    'workspaces/probe/artifacts/datei-2: Error: Originaldiagnose der zweiten Datei',
  ];
  await page.evaluate(async (details) => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    services.workspaces.cleanAbandoned = async () => ({
      removed: ['probe/datei-0'],
      failures: details,
    });
  }, failures);
  await clean();
  const notice = storage.locator('.dw-notice.dw-tone-warning');
  await expect(notice).toContainText('1 Dateien wurden bereinigt.');
  await expect(notice).toContainText('2 Dateien konnten nicht bereinigt werden.');
  await expect(notice.locator('li')).toHaveText(failures);
  await page.clock.fastForward(10_000);
  await expect(notice).toBeVisible();
  await notice.getByRole('button', {name: 'Hinweis schliessen', exact: true}).click();
  await expect(notice).toHaveCount(0);
  await expect(manage).toBeFocused();
  await clean();
  await expect(notice.locator('li')).toHaveText(failures);
});

test('Action feedback: date-check completion expires while real orphan-file findings remain visible', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('link', {name: 'Diagnose', exact: true}).click();
  const check = page.getByRole('button', {name: 'Integrität prüfen', exact: true});
  await expect(check).toBeEnabled();
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const status = page.locator('.diagnostics-check-status');
  await check.click();
  await expect(status).toHaveText('Die Dateiprüfung ist abgeschlossen.');
  await page.clock.fastForward(2999);
  await expect(status).toHaveText('Die Dateiprüfung ist abgeschlossen.');
  await page.clock.fastForward(1);
  await expect(status).toHaveText('');
  // Add a synthetic unmanaged file, then use the real inventory check to find it.
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const workspaces = await root.getDirectoryHandle('workspaces', {create: true});
    const workspace = await workspaces.getDirectoryHandle(location.pathname.split('/')[2]!, {
      create: true,
    });
    const artifacts = await workspace.getDirectoryHandle('artifacts', {create: true});
    const handle = await artifacts.getFileHandle(crypto.randomUUID(), {create: true});
    const writer = await handle.createWritable();
    await writer.write('synthetischer Rest einer abgebrochenen Dateioperation');
    await writer.close();
  });
  await check.click();
  await expect(status).toHaveText('Die Dateiprüfung ist abgeschlossen.');
  const finding = page
    .getByRole('region', {name: 'Dateiprüfung', exact: true})
    .locator('.dw-notice');
  await expect(finding).toContainText('Bei der Dateiprüfung wurden Auffälligkeiten festgestellt.');
  await expect(
    finding.locator('.dw-meta-list > div').filter({hasText: 'Verwaiste Dateien'}),
  ).toContainText('1');
  await page.clock.fastForward(3000);
  await expect(status).toHaveText('');
  await expect(finding).toBeVisible();
  await expect(finding.getByRole('button', {name: 'Hinweis schliessen', exact: true})).toHaveCount(
    0,
  );
});

import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';
import {setupPortal, portalConfig} from '../portal/setup';

async function createProject(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Pflichtfelder');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Pflichtfelder', exact: true})).toBeVisible();
}

async function snapshot(page: Page, settlePreviousChanges = false) {
  return page.evaluate(async (settle) => {
    const entry = performance
      .getEntriesByType('resource')
      .find((entry) => new URL(entry.name).pathname === '/src/app/services.ts');
    if (!entry) throw Error('Services module missing');
    const {services} = (await import(entry.name)) as typeof import('../../src/app/services');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    // Settle valid setup work before a baseline; observations after invalid actions never flush.
    if (settle) await session.flush();
    return {document: session.document, generation: session.persistence.generation};
  }, settlePreviousChanges);
}

async function openSql(page: Page) {
  await createProject(page);
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
}

async function runCode(page: Page, text: string) {
  const code = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await code.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await code.press('ControlOrMeta+Enter');
}

async function saved(page: Page) {
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
}
async function capture(page: Page, name: string) {
  await page.screenshot({
    path: `docs/verification/buttons-v1.3/required-fields/${test.info().project.name}-${name}.png`,
    fullPage: true,
  });
}

test('Required fields: creating a project shows a field error and preserves Unicode names', async ({
  page,
}) => {
  await page.goto('/projects');
  const name = page.getByLabel('Name des neuen Projekts');
  await expect(name).toHaveAttribute('required');
  await expect(page.getByText('* Pflichtfeld', {exact: true})).toHaveCount(0);
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription('Bitte gib einen Projektnamen ein.');
  await expect(page.locator('.error-notice')).toHaveCount(0);
  await name.fill('   ');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await name.fill('  Ölten öffentlich  ');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Ölten öffentlich', exact: true})).toBeVisible();
});

for (const kind of ['sql', 'r']) {
  test(`Required fields: ${kind} name guards save and run buttons and keyboard shortcuts`, async ({
    page,
  }) => {
    await createProject(page);
    await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
    await page
      .getByRole('menuitem', {
        name: kind === 'sql' ? 'Neue SQL-Abfrage' : 'Neues R-Skript',
        exact: true,
      })
      .click();
    await expect(page.locator('.monaco-editor')).toBeVisible();
    if (kind === 'r')
      await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
    const name = page.getByLabel('Analysename', {exact: true});
    await expect(name).toHaveAttribute('required');
    await expect(page.locator('.analysis-toolbar label')).toBeVisible();
    const before = await snapshot(page, true);
    await name.fill('');
    await page.getByRole('button', {name: 'Speichern', exact: true}).click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAccessibleDescription('Bitte gib einen Analysenamen ein.');
    await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
    expect(await snapshot(page)).toEqual(before);
    const code = page.getByRole('textbox', {name: 'Analysecode'});
    await page.locator('.monaco-editor').click();
    await code.press('ControlOrMeta+s');
    await expect(name).toBeFocused();
    await page.locator('.monaco-editor').click();
    await code.press('ControlOrMeta+Enter');
    await expect(name).toBeFocused();
    expect(await snapshot(page)).toEqual(before);
    await expect(page.locator('.error-notice')).toHaveCount(0);
    await capture(page, `${kind}-name-error`);
    await name.fill('Öffentliche Analyse');
    await name.press('ControlOrMeta+s');
    await saved(page);
    await page.reload();
    await expect(name).toHaveValue('Öffentliche Analyse');
  });
}

test('Required fields: file selection, drag and drop, import validation and dataset renaming share one valid value', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog');
  const file = dialog.locator('input[type=file]');
  await expect(file).toHaveAttribute('required');
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(dialog.getByRole('button', {name: 'Datei auswählen', exact: true})).toBeFocused();
  await expect(file).toHaveAttribute('aria-invalid', 'true');
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['id;wert\n1;10\n'], 'messung.csv', {type: 'text/csv'}));
    return data;
  });
  await dialog.locator('.file-drop').dispatchEvent('drop', {dataTransfer: transfer});
  await transfer.dispose();
  await expect(dialog.locator('.dw-file-name')).toHaveText('messung.csv');
  expect(await file.evaluate((input) => (input as HTMLInputElement).validity.valueMissing)).toBe(
    false,
  );
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(dialog.getByRole('cell', {name: '10', exact: true})).toBeVisible();
  const before = await snapshot(page, true);
  const name = dialog.getByLabel('Anzeigename', {exact: true});
  const sql = dialog.getByLabel('SQL-Name', {exact: true});
  await name.fill(' ');
  await sql.fill('__dw_intern');
  await dialog.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(sql).toHaveAccessibleDescription(/Präfix __dw_/);
  await capture(page, 'file-import-errors');
  expect(await snapshot(page)).toEqual(before);
  await name.fill('Öffentliche Messung');
  await sql.fill('messung');
  await dialog.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  const display = page.getByLabel('Anzeigename messung', {exact: true});
  const imported = await snapshot(page, true);
  await display.fill('');
  await display.press('Tab');
  await expect(display).toHaveAccessibleDescription('Bitte gib einen Datensatznamen ein.');
  expect(await snapshot(page)).toEqual(imported);
  await display.fill('Ölten');
  await display.press('Tab');
  await saved(page);
  await page.reload();
  await expect(display).toHaveValue('Ölten');
  await expect(page.getByText('data.messung', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Daten ersetzen', exact: true}).click();
  await expect(dialog.getByLabel('SQL-Name', {exact: true})).toBeDisabled();
  await expect(dialog.getByLabel('SQL-Name', {exact: true})).not.toHaveAttribute('required');
  await expect(dialog.getByLabel('Anzeigename', {exact: true})).toHaveAttribute('required');
});

test('Required fields: CSV column errors prevent preview work and keep the last document unchanged', async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'spalten.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('id;wert\n1;10\n'),
  });
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  const column = dialog.getByLabel('Spalte 1', {exact: true});
  await expect(column).toHaveAttribute('required');
  await column.fill('');
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(column).toBeFocused();
  await expect(column).toHaveAccessibleDescription('Bitte gib einen Spaltennamen ein.');
  await column.fill('wert');
  await column.press('Tab');
  await expect(column).toHaveAccessibleDescription('Dieser Spaltenname wird bereits verwendet.');
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  const otherColumn = dialog.getByLabel('Spalte 2', {exact: true});
  await expect(otherColumn).toHaveAttribute('aria-invalid', 'true');
  await column.fill('kennung');
  await expect(column).not.toHaveAttribute('aria-invalid', 'true');
  await expect(otherColumn).not.toHaveAttribute('aria-invalid', 'true');
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(dialog.getByRole('columnheader', {name: /kennung/})).toBeVisible();
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'tab.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('id\twert\n1\t10\n'),
  });
  await dialog.getByLabel('Trennzeichen', {exact: true}).selectOption('\t');
  await dialog.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await expect(dialog.getByRole('columnheader', {name: /^id /})).toBeVisible();
  await expect(dialog.getByRole('columnheader', {name: /^wert /})).toBeVisible();
  await expect(dialog.getByRole('cell', {name: '10', exact: true})).toBeVisible();
  expect(Object.keys((await snapshot(page)).document.datasets)).toHaveLength(0);
});

test('Required fields: parameter values are required by type and empty strings and NULL stay valid', async ({
  page,
}) => {
  await openSql(page);
  const parameters = page.locator('.parameters');
  await parameters.locator('summary').click();
  await parameters.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  const name = parameters.getByLabel('Parameter 1 Name', {exact: true});
  const value = parameters.getByLabel('Parameter 1 Wert', {exact: true});
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await name.fill('text');
  await expect(value).not.toHaveAttribute('required');
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  expect(Object.values((await snapshot(page)).document.analyses)[0]!.parameters).toEqual({
    text: '',
  });
  await parameters.getByLabel('Parameter 1 Typ', {exact: true}).selectOption('number');
  await expect(value).toHaveAttribute('required');
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  await expect(value).toBeFocused();
  await expect(value).toHaveAccessibleDescription(/endliche Zahl/);
  await capture(page, 'parameter-value-error');
  expect(Object.values((await snapshot(page)).document.analyses)[0]!.parameters).toEqual({
    text: '',
  });
  await value.fill('0');
  await expect(value).not.toHaveAttribute('aria-invalid', 'true');
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  expect(Object.values((await snapshot(page)).document.analyses)[0]!.parameters).toEqual({text: 0});
  await parameters.getByLabel('Parameter 1 Typ', {exact: true}).selectOption('null');
  await expect(value).toBeDisabled();
  await expect(value).not.toHaveAttribute('required');
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  expect(Object.values((await snapshot(page)).document.analyses)[0]!.parameters).toEqual({
    text: null,
  });
  await parameters.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  const otherName = parameters.getByLabel('Parameter 2 Name', {exact: true});
  await otherName.fill('text');
  await parameters.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(otherName).toHaveAttribute('aria-invalid', 'true');
  await otherName.fill('anderer_text');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await expect(otherName).not.toHaveAttribute('aria-invalid', 'true');
  expect(Object.values((await snapshot(page)).document.analyses)[0]!.parameters).toEqual({
    text: null,
  });
});

test('Required fields: SQL dataset and R transfer validate before keeping results or creating an analysis', async ({
  page,
}) => {
  await openSql(page);
  await runCode(page, 'SELECT 1::INTEGER AS wert');
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(1);
  const before = await snapshot(page, true);
  const result = page.locator('.result-data');
  await result.locator('summary').click();
  await result.getByLabel('Datensatzname', {exact: true}).fill('');
  await result.getByRole('button', {name: 'Als Datensatz speichern', exact: true}).click();
  await expect(result.getByLabel('Datensatzname', {exact: true})).toBeFocused();
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button', {name: 'In R', exact: true}).click();
  const dialog = page.getByRole('dialog');
  const variable = dialog.getByLabel('R-Variablenname', {exact: true});
  await variable.fill('params');
  await dialog.getByRole('button', {name: 'Transfer prüfen', exact: true}).click();
  await expect(variable).toBeFocused();
  await expect(variable).toHaveAccessibleDescription(/Reservierte Wörter/);
  expect(await snapshot(page)).toEqual(before);
  await variable.fill('daten');
  await dialog.getByRole('button', {name: 'Transfer prüfen', exact: true}).click();
  await expect(dialog.getByRole('button', {name: 'In R übernehmen', exact: true})).toBeVisible({
    timeout: 60000,
  });
  await dialog.getByRole('button', {name: 'In R übernehmen', exact: true}).click();
  await expect(page.locator('.r-workbench')).toBeVisible();
  await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
  await runCode(page, 'vergleich <- data.frame(wert=1L)');
  await expect(page.getByRole('button', {name: /vergleich · 1 × 1/})).toBeVisible();
  await page.getByRole('button', {name: /vergleich · 1 × 1/}).click();
  await page.getByRole('button', {name: 'Objekt als Datensatz', exact: true}).click();
  await expect(dialog.getByLabel('Datensatzname', {exact: true})).toBeVisible();
  const captureBefore = await snapshot(page, true);
  await dialog.getByLabel('SQL-Name', {exact: true}).fill('__dw_test');
  await dialog.getByRole('button', {name: 'Datensatz übernehmen', exact: true}).click();
  await expect(dialog.getByLabel('SQL-Name', {exact: true})).toBeFocused();
  expect(await snapshot(page)).toEqual(captureBefore);
  await dialog.getByLabel('SQL-Name', {exact: true}).fill('vergleich');
  await dialog.getByRole('button', {name: 'Datensatz übernehmen', exact: true}).click();
  await expect(dialog).toHaveCount(0);
  expect(Object.values((await snapshot(page)).document.datasets).map((d) => d.sqlName)).toEqual([
    'vergleich',
  ]);
  await page.getByRole('button', {name: /vergleich · 1 × 1/}).click();
  await page.getByRole('button', {name: 'Objekt als Datensatz', exact: true}).click();
  const replacement = Object.values((await snapshot(page)).document.datasets)[0]!;
  const technicalName = dialog.getByLabel('SQL-Name', {exact: true});
  await technicalName.fill('neuer_entwurf');
  await dialog.getByLabel('Zieldatensatz', {exact: true}).selectOption(replacement.id);
  await expect(technicalName).toBeDisabled();
  await expect(technicalName).not.toHaveAttribute('required');
  await expect(technicalName).toHaveValue('vergleich');
  await dialog.getByLabel('Zieldatensatz', {exact: true}).selectOption('new');
  await expect(technicalName).toBeEnabled();
  await expect(technicalName).toHaveAttribute('required');
  await expect(technicalName).toHaveValue('neuer_entwurf');
  await dialog.getByRole('button', {name: 'Schliessen', exact: true}).click();
  await page.getByRole('button', {name: 'SQL', exact: true}).click();
  await page.getByRole('button', {name: 'In R', exact: true}).click();
  await dialog.getByRole('button', {name: 'Transfer prüfen', exact: true}).click();
  const approval = dialog.getByRole('checkbox', {
    name: /Vorhandene Variable daten ausdrücklich ersetzen/,
  });
  await expect(approval).toBeVisible({timeout: 60000});
  await expect(approval).toHaveAttribute('required');
  const approvalBefore = await snapshot(page, true);
  await dialog.getByRole('button', {name: 'In R übernehmen', exact: true}).click();
  await expect(approval).toBeFocused();
  await expect(approval).toHaveAccessibleDescription(/Bitte bestätige/);
  expect(await snapshot(page)).toEqual(approvalBefore);
  await capture(page, 'transfer-approval-error');
  await approval.check();
  await expect(approval).not.toHaveAttribute('aria-invalid', 'true');
  await dialog.getByRole('button', {name: 'In R übernehmen', exact: true}).click();
  await expect(dialog).toHaveCount(0);
});

test('Required fields: portal stages allow an empty index search and validate before creating a project', async ({
  page,
  request,
}) => {
  await setupPortal(page, request);
  await page.route('**/runtime-config.json', (route) => route.fulfill({json: portalConfig}));
  await page.goto('/open?provider=fixture&dataset=x');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Portaltabelle', {exact: true})).toBeVisible();
  await dialog.getByRole('button', {name: 'Index durchsuchen', exact: true}).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('button', {name: 'Kontext laden', exact: true}).click();
  await expect(dialog.getByLabel('Dataset-ID oder Portal-URL', {exact: true})).toBeFocused();
  await dialog.getByRole('button', {name: 'Portalvorschau laden', exact: true}).click();
  await expect(dialog.getByRole('cell', {name: '001', exact: true})).toBeVisible();
  await dialog.getByLabel('Anzeigename', {exact: true}).fill('');
  await dialog.getByRole('button', {name: 'Portalimport bestätigen', exact: true}).click();
  await expect(dialog.getByLabel('Anzeigename', {exact: true})).toBeFocused();
  expect(
    await page.evaluate(async () => {
      const path = '/src/app/services.ts';
      const {services} = (await import(path)) as typeof import('../../src/app/services');
      return (await services.workspaces.list()).length;
    }),
  ).toBe(0);
  await dialog.getByLabel('Anzeigename', {exact: true}).fill('Portal-Daten');
  await dialog.getByRole('button', {name: 'Portalimport bestätigen', exact: true}).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/data$/);
});

test('Required fields: editing a project preserves its valid name until correction and save', async ({
  page,
}) => {
  await createProject(page);
  const name = page.getByLabel('Projektname', {exact: true});
  await expect(name).toHaveAttribute('required');
  const before = await snapshot(page, true);
  await name.fill('');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Beschreibung', {exact: true}).focus();
  await expect(name).toHaveAccessibleDescription('Bitte gib einen Projektnamen ein.');
  await expect(page.getByLabel('Beschreibung', {exact: true})).toBeFocused();
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(name).toBeFocused();
  expect(await snapshot(page)).toEqual(before);
  await expect(page.locator('.error-notice')).toHaveCount(0);
  await capture(page, 'project-name-error');
  await name.fill('Öffentliche Auswertung');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(page.locator('.workspace-content[data-save-state]')).toHaveAttribute(
    'data-save-state',
    'saved',
  );
  await page.reload();
  await expect(name).toHaveValue('Öffentliche Auswertung');
});

test('Required fields: read-only project metadata keeps its semantics and cannot be edited', async ({
  page,
  context,
}) => {
  await createProject(page);
  const other = await context.newPage();
  await other.goto(page.url());
  await expect(other.getByText(/Nur lesend/)).toBeVisible();
  const name = other.getByLabel('Projektname', {exact: true});
  await expect(name).toHaveAttribute('required');
  await expect(name).toBeDisabled();
  await expect(other.getByLabel('Beschreibung', {exact: true})).not.toHaveAttribute('required');
  await expect(other.getByRole('button', {name: 'Speichern', exact: true})).toBeDisabled();
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await other.close();
});

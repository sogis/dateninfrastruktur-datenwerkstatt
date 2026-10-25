import {test, expect} from '../persistentBrowser';
import type {Page} from '@playwright/test';
import {openAnalysisRename, openSqlParameters} from '../ui/sqlActions';
async function create(page: Page) {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('SQL aufgeräumt');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
}
async function editor(page: Page, value: string) {
  await page.locator('.monaco-editor').click();
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+a');
  await page.keyboard.insertText(value);
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+s');
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    await session.flush();
    return structuredClone(session.document);
  });
}
async function openDocument(page: Page, name: string) {
  await page.getByRole('button', {name: 'Öffnen', exact: true}).click();
  const dialog = page.getByRole('dialog', {name: 'SQL-Analyse öffnen', exact: true});
  await dialog.getByRole('button', {name: `Analyse ${name} öffnen`, exact: true}).click();
  await expect(dialog).toHaveCount(0);
}

test('SQL documents: save and load independent editor texts and undo without running; kept results and reload', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({width: 1440, height: 900});
  await create(page);
  await expect(page.getByLabel('Analysename', {exact: true})).toHaveCount(0);
  await expect(page.locator('.analysis-name-text')).toHaveText('Analysename: Neue SQL-Abfrage');
  await expect(page.locator('.analysis-name-text')).toHaveCSS('font-weight', '400');
  await expect(page.locator('.parameters')).toHaveCount(0);
  await expect(page.getByRole('combobox', {name: 'Lauf', exact: true})).toHaveCount(0);
  await editor(page, 'SELECT CAST($jahr AS INTEGER) AS jahr');
  await openSqlParameters(page);
  await expect(page.getByRole('dialog')).toContainText('WHERE jahr = $jahr');
  await page.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  await page.getByLabel('Parameter 1 Name', {exact: true}).fill('jahr');
  await page.getByLabel('Parameter 1 Typ', {exact: true}).selectOption('number');
  await page.getByLabel('Parameter 1 Wert', {exact: true}).fill('2025');
  await page.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Parameter (1)', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('2025');
  const first = await state(page);
  const firstId = Object.keys(first.analyses)[0]!;
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', {name: 'SQL-Datei öffnen', exact: true}).click();
  await (
    await chooser
  ).setFiles({
    name: 'Zweite.sql',
    mimeType: 'application/sql',
    buffer: Buffer.from('SELECT 7 AS wert'),
  });
  await expect(page.locator('.analysis-name-text')).toHaveText('Analysename: Zweite');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 7 AS wert');
  await expect(page.getByRole('button', {name: 'Parameter (1)', exact: true})).toHaveCount(0);
  expect(Object.keys((await state(page)).runs)).toEqual(Object.keys(first.runs));
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('7');
  // Edit one character so Undo has one operation, independent of word-wise typing groups.
  const input = page.getByRole('textbox', {name: 'Analysecode'});
  await page.locator('.monaco-editor').click();
  await input.press('Home');
  for (let i = 0; i < 7; i++) await input.press('ArrowRight');
  await input.press('Shift+ArrowRight');
  await page.keyboard.insertText('9');
  await input.press('ControlOrMeta+s');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 9 AS wert');
  await expect(page.locator('.result-grid tbody td')).toHaveText('7');
  await expect(page.getByText(/Das Ergebnis gehört zur letzten Ausführung/)).toHaveCount(0);
  await page.getByText('Laufdetails und eingefrorener Code', {exact: true}).click();
  await expect(page.locator('.run-details')).toContainText('SELECT 7 AS wert');
  await page.getByText('Laufdetails und eingefrorener Code', {exact: true}).click();
  const cursor = () =>
    page.evaluate(async () => {
      const path = '/src/infrastructure/monaco/runtime.ts';
      const {monaco} = (await import(
        path
      )) as typeof import('../../src/infrastructure/monaco/runtime');
      return monaco.editor.getEditors()[0]!.getPosition();
    });
  const savedCursor = await cursor();
  const beforeLoad = await state(page);
  await openDocument(page, 'Neue SQL-Abfrage');
  await expect(page.locator('.monaco-editor')).toContainText('CAST($jahr AS INTEGER)');
  await expect(page.getByRole('button', {name: 'Parameter (1)', exact: true})).toBeVisible();
  await expect(page.locator('.result-grid tbody td')).toHaveText('2025');
  await openDocument(page, 'Zweite');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 9 AS wert');
  expect(await cursor()).toEqual(savedCursor);
  await page.locator('.monaco-editor').click();
  await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+z');
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 7 AS wert');
  const afterLoad = await state(page);
  expect(Object.keys(afterLoad.runs)).toEqual(Object.keys(beforeLoad.runs));
  expect(afterLoad.analyses[firstId as keyof typeof afterLoad.analyses]).toEqual(
    first.analyses[firstId as keyof typeof first.analyses],
  );
  expect(afterLoad).not.toHaveProperty('sqlVersions');
  await page.getByRole('button', {name: 'Aufbewahren', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Aufbewahren', exact: true})).toBeDisabled();
  await editor(page, 'SELECT 70 AS wert');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('70');
  await expect(page.getByText(/Das Ergebnis gehört zur letzten Ausführung/)).toHaveCount(0);
  await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Aufbewahrte Ergebnisse', exact: true}).click();
  await page.getByRole('button', {name: 'Ergebnis anzeigen', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('7');
  await page.getByRole('button', {name: 'Zum aktuellen Ergebnis', exact: true}).click();
  await expect(page.locator('.result-grid tbody td')).toHaveText('70');
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(viewport);
    const editorBox = (await page.locator('.code-editor').boundingBox())!;
    const resultBox = (await page.getByRole('region', {name: 'SQL-Resultat'}).boundingBox())!;
    const hostBox = (await page.locator('.sql-panel-host').boundingBox())!;
    expect((await page.locator('.analysis-toolbar').boundingBox())!.height).toBeLessThanOrEqual(88);
    expect(hostBox.height).toBeGreaterThanOrEqual(viewport.height * 0.75);
    expect(hostBox.width).toBeGreaterThanOrEqual((viewport.width - 52) * 0.9);
    expect(editorBox.height).toBeGreaterThanOrEqual(180);
    expect(resultBox.height).toBeGreaterThanOrEqual(220);
  }
  await page.screenshot({path: info.outputPath('sql-documents.png')});
  const saved = await state(page);
  await page.reload();
  await expect(page.locator('.monaco-editor')).toContainText('SELECT 70 AS wert');
  expect(Object.keys((await state(page)).runs)).toEqual(Object.keys(saved.runs));
  await expect(page.locator('.analysis-toolbar')).not.toContainText(/Revision \d/);
  expect(errors).toEqual([]);
});

test('SQL cleanup: overview rename commits only on submit and schema stays nonmodal at wide/narrow widths', async ({
  page,
}, info) => {
  await create(page);
  const link = await openAnalysisRename(page);
  const name = page.getByLabel('Analysename', {exact: true});
  await name.fill('Verwerfen');
  await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  await expect(link).toHaveText('Neue SQL-Abfrage');
  await link.locator('..').getByRole('button').click();
  await page.getByRole('menuitem', {name: 'Umbenennen', exact: true}).click();
  await name.fill('');
  await page.getByRole('button', {name: 'Umbenennen', exact: true}).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  await name.fill('  Ölten  ');
  await page.getByRole('button', {name: 'Umbenennen', exact: true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(link).toHaveText('Ölten');
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await page.getByRole('button', {name: 'Daten hinzufügen', exact: true}).click();
  await page.getByRole('menuitem', {name: 'Datei hinzufügen', exact: true}).click();
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles({name: 'zahlen.csv', mimeType: 'text/csv', buffer: Buffer.from('wert\n1\n')});
  await page.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  await page.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('link', {name: 'Ölten', exact: true}).click();
  const before = await state(page);
  for (const width of [1440, 1280, 390]) {
    await page.setViewportSize({width, height: width === 390 ? 700 : 900});
    await page.getByRole('button', {name: 'Tabellen & Spalten', exact: true}).click();
    const schema = page.getByRole('complementary', {name: 'Tabellen & Spalten'});
    await expect(schema).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (width === 1440) {
      const resize = page.getByRole('separator', {
        name: 'Breite von Tabellen & Spalten ändern',
        exact: true,
      });
      const beforeResize = await state(page);
      const initialWidth = (await schema.boundingBox())!.width;
      await resize.focus();
      await resize.press('ArrowLeft');
      await expect
        .poll(async () => (await schema.boundingBox())!.width)
        .toBeGreaterThan(initialWidth);
      const handle = (await resize.boundingBox())!;
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x - 35, handle.y + handle.height / 2);
      await page.mouse.up();
      const resizedWidth = (await schema.boundingBox())!.width;
      const hostWidth = (await page.locator('.sql-panel-host').boundingBox())!.width;
      expect(resizedWidth).toBeGreaterThanOrEqual(220);
      expect(resizedWidth).toBeLessThanOrEqual(hostWidth * 0.45 + 1);
      expect((await page.locator('.code-editor').boundingBox())!.width).toBeGreaterThanOrEqual(320);
      await expect
        .poll(() =>
          page.evaluate(async () => {
            const path = '/tests/spike/appServices.ts';
            const {services} = (await import(path)) as typeof import('../spike/appServices');
            return (
              await services.views.load(
                location.pathname.split('/')[2]! as import('../../src/domain/model').WorkspaceId,
              )
            ).sqlSchemaFraction;
          }),
        )
        .toBeGreaterThan(0.25);
      expect(await state(page)).toEqual(beforeResize);
      await page.reload();
      await expect(schema).toBeVisible();
      await expect
        .poll(async () => (await schema.boundingBox())!.width)
        .toBeCloseTo(resizedWidth, 0);
      await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
      await page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen', exact: true}).click();
      await expect(schema).toHaveCount(0);
      await page.getByRole('button', {name: 'Tabellen & Spalten', exact: true}).click();
      await expect(schema).toBeVisible();
      const groupWidth = (await page.locator('.sql-editor-row').boundingBox())!.width;
      await expect
        .poll(async () => (await schema.boundingBox())!.width / (groupWidth - handle.width))
        .toBeCloseTo(0.25, 2);
      await expect
        .poll(async () => {
          const host = (await page.locator('.sql-panel-host').boundingBox())!.height;
          const verticalHandle = (await page
            .getByRole('separator', {name: 'Grösse von Editor und Resultat ändern'})
            .boundingBox())!.height;
          return (
            (await page.locator('.code-editor').boundingBox())!.height / (host - verticalHandle)
          );
        })
        .toBeCloseTo(0.45, 2);
      expect(await state(page)).toEqual(beforeResize);
    }
    await schema.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(schema).toContainText('wert');
    await expect(schema).toContainText('INTEGER');
    await editor(page, 'SELECT wert FROM zahlen');
    await expect(schema.locator('.sql-schema-heading')).toBeInViewport();
    await expect(schema.locator('summary')).toBeInViewport();
    await page.screenshot({path: info.outputPath(`sql-schema-${width}.png`), fullPage: true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await schema.getByRole('button', {name: 'Schliessen', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Tabellen & Spalten', exact: true})).toBeFocused();
  }
  const after = await state(page);
  expect(Object.keys(after.runs)).toEqual(Object.keys(before.runs));
  expect(after).not.toHaveProperty('sqlVersions');
});

test('SQL results: compact actions, typed table headers, row numbers and sort without a new run', async ({
  page,
}, info) => {
  await create(page);
  await editor(
    page,
    'SELECT i::INTEGER AS wert, CASE WHEN i=1 THEN NULL ELSE i::INTEGER END AS optional FROM range(350) t(i) ORDER BY i DESC',
  );
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(100);
  await expect(page.locator('.result-actions')).toHaveCount(1);
  await expect(page.locator('.result-actions .dw-meta-list')).toHaveCount(0);
  await expect(page.locator('.result-footer')).toContainText('350');
  const summary = page.locator('.result-footer [role="status"]');
  await expect(summary.locator('span')).toHaveText(['350 Zeilen', /^(?:[1-9]\d* ms|\d+\.\d s)$/]);
  await expect(summary).toHaveCSS('display', 'flex');
  await expect(summary).toHaveCSS('flex-wrap', 'wrap');
  await expect(summary).toHaveCSS('gap', '9.6px');
  await expect(summary).toHaveCSS('font-size', '12px');
  await expect(summary).toHaveCSS('font-weight', '400');
  const summaryStyle = await summary.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      fontFamily: style.fontFamily,
      expectedFont: style.getPropertyValue('--dw-font-code').trim(),
    };
  });
  expect(summaryStyle.color).toBe('rgb(91, 102, 115)');
  expect(summaryStyle.fontFamily.replaceAll('"', "'")).toBe(summaryStyle.expectedFont);
  const paging = page.locator('.result-paging');
  const range = paging.locator('.result-paging-range');
  const previous = paging.getByRole('button', {name: 'Vorherige Seite', exact: true});
  const next = paging.getByRole('button', {name: 'Nächste Seite', exact: true});
  await expect(range).toHaveText('1–100 von 350');
  await expect(range).toHaveCSS('font-family', summaryStyle.fontFamily);
  await expect(range).toHaveCSS('font-size', '12px');
  await expect(range).toHaveCSS('font-weight', '400');
  await expect(range).toHaveCSS('color', summaryStyle.color);
  await expect(paging).toHaveCSS('flex-wrap', 'nowrap');
  await expect(paging).toHaveCSS('gap', '8px');
  await expect(paging.getByRole('button')).toHaveCount(2);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  for (const button of [previous, next]) {
    await expect(button).toHaveClass(/dw-button--tertiary/);
    await expect(button).toHaveText('');
    await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(button).toHaveCSS('width', '40px');
    await expect(button).toHaveCSS('height', '40px');
  }
  await page.keyboard.press('Tab');
  await next.focus();
  await expect(next).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText('Nächste Seite');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.locator('.result-footer')).not.toContainText(
    /Vollständig|Temporär|Aufbewahrung|Umfang/,
  );
  await expect(page.locator('.export-note')).toHaveCount(0);
  await expect(page.locator('.result-column-name')).toHaveText(['wert', 'optional']);
  await expect(page.locator('.result-column-type')).toHaveText(['INTEGER', 'INTEGER']);
  await expect(page.locator('.result-grid table')).toHaveCSS('font-size', '12px');
  await expect(page.locator('.result-grid thead th').first()).toHaveCSS('font-size', '12px');
  await expect(page.locator('.result-grid tbody tr').first().getByRole('rowheader')).toHaveText(
    '1',
  );
  const before = await state(page);
  // Delay delivery of the real DuckDB page to observe the loading controls deterministically.
  await page.evaluate(async () => {
    const path = '/tests/spike/appServices.ts';
    const {services} = (await import(path)) as typeof import('../spike/appServices');
    const session = await services.workspaces.open(location.pathname.split('/')[2]!);
    const analyses = session.getAnalyses();
    const originalPage = analyses.page;
    const gate = new Promise<void>((resolve) => Reflect.set(window, '__releasePaging', resolve));
    analyses.page = async (...args) => {
      analyses.page = originalPage;
      const result = await originalPage.apply(analyses, args);
      await gate;
      return result;
    };
  });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(previous).toBeDisabled();
  await expect(next).toBeDisabled();
  await page.evaluate(() => {
    const release: unknown = Reflect.get(window, '__releasePaging');
    if (typeof release !== 'function') throw new Error('Paging release is unavailable');
    release();
    Reflect.deleteProperty(window, '__releasePaging');
  });
  await expect(page.locator('.result-grid tbody tr').first().getByRole('rowheader')).toHaveText(
    '101',
  );
  await expect(range).toHaveText('101–200 von 350');
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();
  await next.focus();
  await page.keyboard.press('Space');
  await expect(range).toHaveText('201–300 von 350');
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(50);
  await expect(range).toHaveText('301–350 von 350');
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  await page.keyboard.press('Tab');
  await previous.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Vorherige Seite');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');
  await expect(range).toHaveText('201–300 von 350');
  await expect(next).toBeEnabled();
  await page.getByRole('button', {name: 'Nach wert sortieren', exact: true}).click();
  await expect(page.locator('.result-grid tbody tr').first().getByRole('rowheader')).toHaveText(
    '1',
  );
  await expect(page.locator('.result-grid tbody tr').first().locator('td').first()).toHaveText('0');
  expect(Object.keys((await state(page)).runs)).toEqual(Object.keys(before.runs));
  await expect(range).toHaveText('1–100 von 350');
  await page.screenshot({path: info.outputPath('sql-table.png')});
  await editor(page, 'SELECT i AS wert FROM range(0) t(i)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(range).toHaveText('0–0 von 0');
  await expect(page.locator('.result-grid tbody tr')).toHaveCount(0);
  await expect(previous).toBeVisible();
  await expect(previous).toBeDisabled();
  await expect(next).toBeVisible();
  await expect(next).toBeDisabled();
});

test('SQL exports: CSV/XLSX notes are deferred and limited Parquet requires review before download', async ({
  page,
}) => {
  await create(page);
  await editor(page, 'SELECT i FROM range(100001) t(i)');
  await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  await expect(page.locator('.result-error')).toContainText(
    'Das App-Limit hat dieses Resultat gekürzt.',
  );
  const before = await state(page);
  const downloads: string[] = [];
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  for (const format of ['CSV', 'XLSX', 'Parquet']) {
    if (format === 'CSV')
      await page.getByRole('button', {name: 'CSV exportieren', exact: true}).click();
    else {
      await page.getByRole('button', {name: 'Weitere Exportformate', exact: true}).click();
      await page.getByRole('menuitem', {name: `${format} exportieren`, exact: true}).click();
    }
    const dialog = page.getByRole('dialog', {name: `${format} exportieren`, exact: true});
    await expect(dialog).toContainText('100000 Zeilen');
    await expect(dialog).toContainText('Der Export enthält nur das begrenzte Ergebnis.');
    if (format === 'CSV') await expect(dialog).toContainText('CSV enthält keine Typinformationen.');
    if (format === 'XLSX') await expect(dialog).toContainText('DECIMAL');
    await dialog.getByRole('button', {name: 'Abbrechen', exact: true}).click();
    await expect(dialog).toHaveCount(0);
  }
  expect(downloads).toEqual([]);
  expect(await state(page)).toEqual(before);
});

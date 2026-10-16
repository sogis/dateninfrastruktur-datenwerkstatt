# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/p7-ui.spec.ts >> P7 AT-054–055 AT-058: measured SQL/R geometry, keyboard splitters, layout reset and reload
- Location: tests/e2e/p7-ui.spec.ts:16:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('menuitem', { name: 'Arbeitsfläche zurücksetzen' })
    - locator resolved to <button tabindex="-1" type="button" role="menuitem" class="dw-button dw-button--ghost  ">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Test source

```ts
  29  |     if (kind === 'r') {
  30  |       await page.getByRole('button', {name: 'R', exact: true}).click();
  31  |       await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
  32  |       await enter(page, 'plot(1:4); cat("Gemessene R-Ausgabe")');
  33  |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  34  |       await expect(page.locator('.r-plot img')).toBeVisible();
  35  |       await expect(page.getByRole('log')).toContainText('Gemessene R-Ausgabe');
  36  |       await page.getByRole('button', {name: 'Grafik Vollbild', exact: true}).click();
  37  |       await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  38  |       const full = await page.locator('.r-plot').evaluate((el) => {
  39  |         const img = el.querySelector('img')!.getBoundingClientRect();
  40  |         const actions = el.querySelector('.dw-actions')!.getBoundingClientRect();
  41  |         return {
  42  |           imageBottom: img.bottom,
  43  |           actionsTop: actions.top,
  44  |           actionsBottom: actions.bottom,
  45  |           height: innerHeight,
  46  |         };
  47  |       });
  48  |       expect(full.imageBottom).toBeLessThanOrEqual(full.actionsTop);
  49  |       expect(full.actionsBottom).toBeLessThanOrEqual(full.height);
  50  |       await page.evaluate(() => document.exitFullscreen());
  51  |       const plotActions = await page
  52  |         .locator('.r-plot .dw-actions')
  53  |         .evaluate((el) => getComputedStyle(el).gap);
  54  |       expect(plotActions).toBe('8px');
  55  |       await page.getByRole('button', {name: 'Objekte / Eingaben'}).click();
  56  |     }
  57  |     for (const size of [
  58  |       {width: 1440, height: 900},
  59  |       {width: 1280, height: 800},
  60  |     ]) {
  61  |       await page.setViewportSize(size);
  62  |       await expect(page.locator('.code-editor')).toBeVisible();
  63  |       const box = await page.evaluate((kind) => {
  64  |         const rect = (selector: string) => {
  65  |           const b = document.querySelector(selector)!.getBoundingClientRect();
  66  |           return {x: b.x, y: b.y, width: b.width, height: b.height, bottom: b.bottom};
  67  |         };
  68  |         return {
  69  |           kind,
  70  |           viewport: {width: innerWidth, height: innerHeight},
  71  |           header: rect('header'),
  72  |           sidebar: rect('.sidebar'),
  73  |           toolbar: rect('.analysis-toolbar'),
  74  |           editor: rect('.code-editor'),
  75  |           area: rect(kind === 'sql' ? '.sql-panels' : '.r-panels'),
  76  |           output: rect(kind === 'sql' ? '.result-section' : '.r-output'),
  77  |           scrollWidth: document.documentElement.scrollWidth,
  78  |         };
  79  |       }, kind);
  80  |       expect(box.header.height).toBe(56);
  81  |       expect(box.sidebar.width).toBe(52);
  82  |       expect(box.toolbar.height).toBeLessThanOrEqual(88);
  83  |       expect(box.area.y - box.toolbar.y).toBeLessThanOrEqual(88);
  84  |       expect(box.area.height).toBeGreaterThanOrEqual(size.height * 0.75);
  85  |       expect(box.area.width).toBeGreaterThanOrEqual((size.width - box.sidebar.width) * 0.9);
  86  |       expect(box.scrollWidth).toBeLessThanOrEqual(size.width);
  87  |       expect(box.area.bottom).toBeLessThanOrEqual(size.height + 1);
  88  |       if (kind === 'sql')
  89  |         await expect(page.locator('.analysis-toolbar [role="status"]')).toHaveAttribute(
  90  |           'aria-live',
  91  |           'off',
  92  |         );
  93  |       if (kind === 'sql' && size.height === 900) {
  94  |         expect(box.editor.height).toBeGreaterThanOrEqual(180);
  95  |         expect(box.output.height).toBeGreaterThanOrEqual(220);
  96  |       }
  97  |       geometry.push(box);
  98  |       await mkdir('docs/verification/projects', {recursive: true});
  99  |       await page.screenshot({
  100 |         path: `docs/verification/projects/p7-${kind}-${info.project.name}-${size.width}.png`,
  101 |       });
  102 |     }
  103 |     const splitter = page.getByRole('separator', {
  104 |       name:
  105 |         kind === 'sql' ? 'Grösse von Editor und Resultat ändern' : 'R Editor und Ausgabe teilen',
  106 |     });
  107 |     await splitter.focus();
  108 |     const before = await splitter.getAttribute('aria-valuenow');
  109 |     await splitter.press(kind === 'sql' ? 'ArrowDown' : 'ArrowRight');
  110 |     await expect(splitter).not.toHaveAttribute('aria-valuenow', before!);
  111 |     const changed = await splitter.getAttribute('aria-valuenow');
  112 |     // Await actual separate view storage, not an arbitrary delay.
  113 |     await expect
  114 |       .poll(() =>
  115 |         page.evaluate(async (kind) => {
  116 |           const p = '/tests/spike/appServices.ts';
  117 |           const {services} = (await import(p)) as typeof import('../../src/app/services');
  118 |           const id = location.pathname.split(
  119 |             '/',
  120 |           )[2] as import('../../src/domain/model').WorkspaceId;
  121 |           const v = await services.views.load(id);
  122 |           return Math.round((kind === 'sql' ? v.sqlEditorFraction : v.rEditorFraction) * 100);
  123 |         }, kind),
  124 |       )
  125 |       .toBe(Number(changed));
  126 |     await page.reload();
  127 |     await expect(splitter).toHaveAttribute('aria-valuenow', changed!);
  128 |     await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
> 129 |     await page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen'}).click();
      |                                                                            ^ Error: locator.click: Target page, context or browser has been closed
  130 |     await expect(splitter).toHaveAttribute('aria-valuenow', kind === 'sql' ? '45' : '50');
  131 |   }
  132 |   await writeFile(
  133 |     `docs/verification/projects/p7-geometry-${info.project.name}.json`,
  134 |     JSON.stringify(geometry, null, 2),
  135 |   );
  136 |   await page.getByRole('button', {name: 'Konsole', exact: true}).click();
  137 |   await expect(page.getByRole('log')).toHaveCount(0);
  138 |   await page.reload();
  139 |   await expect(page.getByRole('log')).toHaveCount(0);
  140 |   await page.getByRole('button', {name: 'SQL', exact: true}).click();
  141 |   expect(page.url()).toBe(sqlUrl);
  142 | });
  143 | test('P7 AT-055–057: native focus trap/return, settings, storage cleanup and data-free diagnostics', async ({
  144 |   page,
  145 | }) => {
  146 |   await create(page);
  147 |   await page.getByRole('link', {name: 'Daten', exact: true}).click();
  148 |   const open = page.getByRole('button', {name: 'Datei hinzufügen', exact: true});
  149 |   await open.click();
  150 |   const dialog = page.getByRole('dialog', {name: 'Datei importieren'});
  151 |   await expect(dialog).toBeVisible();
  152 |   for (let i = 0; i < 25; i++) {
  153 |     await page.keyboard.press('Tab');
  154 |     expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  155 |   }
  156 |   await page.keyboard.press('Escape');
  157 |   await expect(dialog).toHaveCount(0);
  158 |   await expect(open).toBeFocused();
  159 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  160 |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  161 |   await enter(page, "SELECT 'PRIVATE_CODE_MARKER' AS wert");
  162 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  163 |   await page.getByText('Lokale Diagnose', {exact: true}).click();
  164 |   let downloaded = page.waitForEvent('download');
  165 |   await page.getByRole('button', {name: 'Diagnosebericht herunterladen'}).click();
  166 |   let path = await (await downloaded).path();
  167 |   const {readFile} = await import('node:fs/promises');
  168 |   expect(await readFile(path!, 'utf8')).not.toContain('PRIVATE_CODE_MARKER');
  169 |   await page.getByLabel('Analysecode ausdrücklich aufnehmen').check();
  170 |   downloaded = page.waitForEvent('download');
  171 |   await page.getByRole('button', {name: 'Diagnosebericht herunterladen'}).click();
  172 |   path = await (await downloaded).path();
  173 |   expect(await readFile(path!, 'utf8')).toContain('PRIVATE_CODE_MARKER');
  174 |   await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  175 |   await expect(page.getByRole('region', {name: 'Browser-Speicher'})).toContainText(
  176 |     'Geschätzter Verbrauch',
  177 |   );
  178 |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  179 |   await expect(page.getByRole('status')).toHaveText('Einstellungen gespeichert');
  180 |   await page.reload();
  181 |   await expect(page.getByLabel('Seitenleiste standardmässig eingeklappt')).not.toBeChecked();
  182 |   await page.getByRole('button', {name: 'Nicht referenzierte Projektreste bereinigen'}).click();
  183 |   await expect(page.getByRole('dialog')).toBeVisible();
  184 |   await page.keyboard.press('Escape');
  185 |   await expect(
  186 |     page.getByRole('button', {name: 'Nicht referenzierte Projektreste bereinigen'}),
  187 |   ).toBeFocused();
  188 |   await expect(page.getByText(/Login|ClickHouse|Freigaben|KI-Assistent/)).toHaveCount(0);
  189 | });
  190 | 
  191 | test('P7 AT-025 AT-055 AT-056: selected SQL is snapshotted and cell markup remains text', async ({
  192 |   page,
  193 | }) => {
  194 |   await create(page);
  195 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  196 |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  197 |   await enter(page, 'SELECT absent FROM absent_table;\nSELECT 42 AS selected');
  198 |   const editor = page.getByRole('textbox', {name: 'Analysecode'});
  199 |   await editor.press('ControlOrMeta+End');
  200 |   await editor.press('Home');
  201 |   await editor.press('Shift+End');
  202 |   await editor.press('ControlOrMeta+Enter');
  203 |   await expect(page.locator('.result-grid tbody td')).toHaveText(['42']);
  204 |   const snapshot = await page.evaluate(async () => {
  205 |     const p = '/tests/spike/appServices.ts';
  206 |     const {services} = (await import(p)) as typeof import('../../src/app/services');
  207 |     const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  208 |     return Object.values(session.document.runs).at(-1)!.snapshot.code;
  209 |   });
  210 |   expect(snapshot).toBe('SELECT 42 AS selected');
  211 |   const marker = '<img src=x onerror="globalThis.p7XSS=1">';
  212 |   await enter(page, `SELECT '${marker}' AS text`);
  213 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  214 |   await expect(page.locator('.result-grid tbody td')).toHaveText([marker]);
  215 |   expect(await page.evaluate(() => Reflect.get(globalThis, 'p7XSS'))).toBeUndefined();
  216 |   expect(await page.locator('.result-grid img, .result-grid script').count()).toBe(0);
  217 | });
  218 | 
  219 | test('P7 AT-058: browser history restores the analysis cursor and layout does not edit the domain', async ({
  220 |   page,
  221 | }) => {
  222 |   await create(page);
  223 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  224 |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  225 |   await enter(page, 'SELECT 11 AS wert');
  226 |   const sqlUrl = page.url();
  227 |   const editor = page.getByRole('textbox', {name: 'Analysecode'});
  228 |   await editor.press('Home');
  229 |   for (let i = 0; i < 7; i++) await editor.press('ArrowRight');
```
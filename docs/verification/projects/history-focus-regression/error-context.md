# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/p7-ui.spec.ts >> P7 AT-058: browser history restores the analysis cursor and layout does not edit the domain
- Location: tests/e2e/p7-ui.spec.ts:219:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('textbox', { name: 'Analysecode' })
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" getByRole('textbox', { name: 'Analysecode' }) with timeout 10000ms
  - waiting for getByRole('textbox', { name: 'Analysecode' })
    24 × locator resolved to <textarea wrap="off" tabindex="0" data-mprt="7" role="textbox" autocorrect="off" autocomplete="off" spellcheck="false" autocapitalize="off" aria-required="false" aria-multiline="true" aria-label="Analysecode" aria-autocomplete="both" aria-roledescription="editor" class="inputarea monaco-mouse-cursor-text"></textarea>
       - unexpected value "inactive"

```

```yaml
- textbox "Analysecode": SELECT 11 AS wert
```

# Test source

```ts
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
  230 |   const position = () =>
  231 |     page.evaluate(async () => {
  232 |       const path = '/src/infrastructure/monaco/runtime.ts';
  233 |       const {monaco} = (await import(
  234 |         path
  235 |       )) as typeof import('../../src/infrastructure/monaco/runtime');
  236 |       return monaco.editor.getEditors()[0]!.getPosition();
  237 |     });
  238 |   expect(await position()).toEqual({lineNumber: 1, column: 8});
  239 |   await page.getByRole('button', {name: 'R', exact: true}).click();
  240 |   const rUrl = page.url();
  241 |   await expect(page.locator('.r-workbench')).toBeVisible();
  242 |   await page.goBack();
  243 |   await expect(page).toHaveURL(sqlUrl);
> 244 |   await expect(editor).toBeFocused();
      |                        ^ Error: expect(locator).toBeFocused() failed
  245 |   expect(await position()).toEqual({lineNumber: 1, column: 8});
  246 |   await page.keyboard.insertText('9');
  247 |   await expect(page.locator('.view-lines')).toContainText(/SELECT\s+911\s+AS\s+wert/);
  248 |   await editor.press('ControlOrMeta+z');
  249 |   await expect(page.locator('.view-lines')).toContainText(/SELECT\s+11\s+AS\s+wert/);
  250 |   await editor.press('ControlOrMeta+s');
  251 |   await expect(page.getByText('Lokal gespeichert · kein Backup', {exact: true})).toBeVisible();
  252 |   await page.goForward();
  253 |   await expect(page).toHaveURL(rUrl);
  254 |   await page.goBack();
  255 |   await expect(page).toHaveURL(sqlUrl);
  256 |   const state = () =>
  257 |     page.evaluate(async () => {
  258 |       const p = '/tests/spike/appServices.ts';
  259 |       const {services} = (await import(p)) as typeof import('../../src/app/services');
  260 |       const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  261 |       await session.flush();
  262 |       return {revision: session.document.revision, runs: Object.keys(session.document.runs)};
  263 |     });
  264 |   const before = await state();
  265 |   const splitter = page.getByRole('separator', {name: 'Grösse von Editor und Resultat ändern'});
  266 |   await splitter.focus();
  267 |   await splitter.press('ArrowDown');
  268 |   await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  269 |   await page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen'}).click();
  270 |   expect(await state()).toEqual(before);
  271 |   expect(before.runs).toEqual([]);
  272 | });
  273 | 
```
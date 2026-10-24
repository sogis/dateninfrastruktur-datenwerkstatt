# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: active SQL continues through settings and cancels after return
- Location: tests/e2e/project-settings.spec.ts:198:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('.run-summary-message')
Expected: "Ausführung abgebrochen"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" locator('.run-summary-message') with timeout 10000ms
  - waiting for locator('.run-summary-message')

```

```yaml
- banner:
  - link "Datenwerkstatt":
    - /url: /projects
- alert:
  - text: "CANCELLED: Berechnung wurde beendet."
  - button "Hinweis schliessen"
- navigation "Hauptnavigation":
  - button "Navigation ausklappen"
  - link "Projekte":
    - /url: /projects
  - link "Übersicht":
    - /url: /projects/0ecc8c5a-cff9-4b04-ba16-f8651d4acc65
  - link "Daten":
    - /url: /projects/0ecc8c5a-cff9-4b04-ba16-f8651d4acc65/data
  - button "SQL"
  - button "R"
  - link "Einstellungen":
    - /url: /projects/0ecc8c5a-cff9-4b04-ba16-f8651d4acc65/settings
  - link "Diagnose":
    - /url: /projects/0ecc8c5a-cff9-4b04-ba16-f8651d4acc65/diagnostics
- text: Analysename
- textbox "Analysename": Neue SQL-Abfrage
- button "Ausführen"
- button "Speichern"
- button "Schema"
- status: Revision 64
- button "Arbeitsfläche zurücksetzen"
- group: Parameter (0)
- code:
  - textbox "Analysecode": SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)
- separator "Grösse von Editor und Resultat ändern"
- region "SQL-Resultat":
  - text: Lauf
  - combobox "Lauf":
    - option "Letzter Lauf" [selected]
  - paragraph: Ausführen oder ⌘/Strg + Enter startet einen neuen Lauf.
- alert
- alert
```

# Test source

```ts
  134 |   const sqlUrl = page.url();
  135 |   await enter(page, 'SELECT i, random() AS zufall FROM range(350) t(i)');
  136 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  137 |   await expect(page.locator('.result-grid tbody tr').first()).toBeVisible();
  138 |   const rows = await page.locator('.result-grid tbody').innerText();
  139 |   const editor = page.getByRole('textbox', {name: 'Analysecode'});
  140 |   await editor.press('ControlOrMeta+End');
  141 |   await editor.press('End');
  142 |   await page.keyboard.insertText('\n-- erhalten');
  143 |   await editor.press('ControlOrMeta+s');
  144 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  145 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  146 |     timeout: 60000,
  147 |   });
  148 |   const rUrl = page.url();
  149 |   await enter(page, 'bleibt <- data.frame(wert=1:3); plot(bleibt$wert); cat("Sitzung bleibt")');
  150 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  151 |   await expect(page.locator('.r-plot img')).toBeVisible();
  152 |   await expect(
  153 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  154 |   ).toBeEnabled();
  155 |   const before = await sessionOf(page);
  156 |   const runtime = await runtimeOf(page);
  157 |   const count = workers.length;
  158 |   await settingsOf(page).click();
  159 |   await expect(page).toHaveURL(url + '/settings');
  160 |   await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  161 |   await page.getByLabel('Zeilennummern', {exact: true}).uncheck();
  162 |   await page.getByLabel('Zeilenumbruch', {exact: true}).check();
  163 |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  164 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  165 |   await expect(page).toHaveURL(sqlUrl);
  166 |   await expect(page.locator('.view-lines')).toHaveCSS('font-size', '18px');
  167 |   await expect(page.locator('.line-numbers')).toHaveCount(0);
  168 |   await expect(page.locator('.result-grid tbody')).toHaveText(rows);
  169 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  170 |   await editor.press('ControlOrMeta+z');
  171 |   await expect(page.locator('.view-lines')).not.toContainText('-- erhalten');
  172 |   await editor.press('ControlOrMeta+Shift+z');
  173 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  174 |   await editor.press('ControlOrMeta+s');
  175 |   await settingsOf(page).click();
  176 |   await page.goBack();
  177 |   await expect(page).toHaveURL(sqlUrl);
  178 |   await page.goForward();
  179 |   await expect(page).toHaveURL(url + '/settings');
  180 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  181 |   await expect(page).toHaveURL(rUrl);
  182 |   await expect(page.locator('.r-plot img')).toBeVisible();
  183 |   await expect(
  184 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  185 |   ).toBeEnabled();
  186 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
  187 |   expect(await runtimeOf(page)).toEqual(runtime);
  188 |   const after = await sessionOf(page);
  189 |   expect(after.id).toBe(before.id);
  190 |   expect(after.document.runs).toEqual(before.document.runs);
  191 |   expect(after.document.results).toEqual(before.document.results);
  192 |   expect(workers).toHaveLength(count);
  193 |   expect(workers.every((worker) => !worker.closed)).toBe(true);
  194 |   await expect(page.locator('.app-error')).toHaveCount(0);
  195 | });
  196 |
  197 | for (const kind of ['sql', 'r'] as const) {
  198 |   test(
  199 |     'Project settings: active ' +
  200 |       kind.toUpperCase() +
  201 |       ' continues through settings and cancels after return',
  202 |     async ({page}) => {
  203 |       const url = await create(page);
  204 |       await navOf(page)
  205 |         .getByRole('button', {name: kind === 'sql' ? 'SQL' : 'R', exact: true})
  206 |         .click();
  207 |       const analysisUrl = page.url();
  208 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  209 |         timeout: 60000,
  210 |       });
  211 |       await enter(
  212 |         page,
  213 |         kind === 'sql'
  214 |           ? 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)'
  215 |           : 'while (TRUE) { sqrt(42) }',
  216 |       );
  217 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  218 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  219 |       const before = await sessionOf(page);
  220 |       expect(before.busy).not.toBeNull();
  221 |       await settingsOf(page).click();
  222 |       await expect(page).toHaveURL(url + '/settings');
  223 |       const during = await sessionOf(page);
  224 |       expect(during.id).toBe(before.id);
  225 |       expect(during.document.runs).toEqual(before.document.runs);
  226 |       expect(during.busy).toBe(before.busy);
  227 |       await page.goBack();
  228 |       await expect(page).toHaveURL(analysisUrl);
  229 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  230 |       await expect(page.locator('.app-error')).toHaveCount(0);
  231 |       expect((await sessionOf(page)).id).toBe(before.id);
  232 |       await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  233 |       await expect.poll(async () => (await sessionOf(page)).busy).toBeNull();
> 234 |       await expect(page.locator('.run-summary-message')).toHaveText('Ausführung abgebrochen');
      |                                                          ^ Error: expect(locator).toHaveText(expected) failed
  235 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  236 |         timeout: 60000,
  237 |       });
  238 |       await expect(page.locator('.app-error')).toHaveCount(0);
  239 |       // A real follow-up execution proves the cancelled engine can be used again.
  240 |       await enter(page, kind === 'sql' ? 'SELECT 42 AS weiter' : 'cat("WEITER_NACH_ABBRUCH")');
  241 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  242 |       if (kind === 'sql') await expect(page.locator('.result-grid tbody td')).toHaveText('42');
  243 |       else await expect(page.getByRole('log')).toContainText('WEITER_NACH_ABBRUCH');
  244 |     },
  245 |   );
  246 | }
  247 |
  248 | test('Project settings: writer lease and stored files survive cleanup while reader edits personal settings', async ({
  249 |   page,
  250 |   context,
  251 | }) => {
  252 |   const url = await create(page);
  253 |   const before = await sessionOf(page);
  254 |   await settingsOf(page).click();
  255 |   const reader = await context.newPage();
  256 |   await reader.goto(url + '/settings');
  257 |   await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  258 |   expect((await sessionOf(reader)).readOnly).toBe(true);
  259 |   await reader.getByLabel('Editor-Schriftgrösse').selectOption('19');
  260 |   await expect(reader.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  261 |   await page.evaluate(async () => {
  262 |     const root = await navigator.storage.getDirectory();
  263 |     const projects = await root.getDirectoryHandle('workspaces', {create: true});
  264 |     const current = await projects.getDirectoryHandle(location.pathname.split('/')[2]!, {
  265 |       create: true,
  266 |     });
  267 |     const writer = await (
  268 |       await current.getFileHandle('settings-protected.bin', {create: true})
  269 |     ).createWritable();
  270 |     await writer.write('active-project-file');
  271 |     await writer.close();
  272 |   });
  273 |   const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  274 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  275 |   await page
  276 |     .getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen', exact: true})
  277 |     .click();
  278 |   await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
  279 |   await expect(page.getByRole('dialog')).toHaveCount(0);
  280 |   await expect(storage.getByRole('status')).toHaveText('Es wurden keine Dateien bereinigt.');
  281 |   expect(
  282 |     await page.evaluate(async () => {
  283 |       const root = await navigator.storage.getDirectory();
  284 |       const projects = await root.getDirectoryHandle('workspaces');
  285 |       const current = await projects.getDirectoryHandle(location.pathname.split('/')[2]!);
  286 |       return (await (await current.getFileHandle('settings-protected.bin')).getFile()).text();
  287 |     }),
  288 |   ).toBe('active-project-file');
  289 |   expect((await sessionOf(page)).id).toBe(before.id);
  290 |   expect((await sessionOf(page)).readOnly).toBe(false);
  291 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  292 |   await expect(
  293 |     reader.getByText('Das Schreibrecht ist weiterhin belegt.', {exact: true}),
  294 |   ).toBeVisible();
  295 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  296 |   await page
  297 |     .getByRole('menuitem', {name: 'Projekte verwalten und gezielt löschen', exact: true})
  298 |     .click();
  299 |   await expect(page).toHaveURL(/\/projects$/);
  300 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  301 |   await expect(
  302 |     reader.getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', {
  303 |       exact: true,
  304 |     }),
  305 |   ).toBeVisible();
  306 |   await expect(reader).toHaveURL(url + '/settings');
  307 |   expect((await sessionOf(reader)).readOnly).toBe(false);
  308 | });
  309 |
```

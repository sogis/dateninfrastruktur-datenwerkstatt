# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: active R continues through settings and cancels after return
- Location: tests/e2e/project-settings.spec.ts:198:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 86

- Object {}
+ Object {
+   "091495f4-eba5-47ce-8ed1-3a1b2ab31708": Object {
+     "id": "091495f4-eba5-47ce-8ed1-3a1b2ab31708",
+     "queuedAt": "2026-10-24T18:25:51.065Z",
+     "resultIds": Array [],
+     "snapshot": Object {
+       "analysisId": "7da2772e-83a0-4c34-9b1d-43cb065b5839",
+       "analysisRevision": 22,
+       "code": "while (TRUE) { sqrt(42) }",
+       "environmentMode": "workspace-session",
+       "inputScope": "explicit-bindings",
+       "language": "r",
+       "notes": Array [
+         "Fresh-Environment ist keine Prozessisolation.",
+       ],
+       "parameters": Object {},
+       "provenance": "session-dependent",
+       "resolvedInputs": Array [],
+       "runtime": Object {
+         "appBuildId": "local-development",
+         "engineId": "webr-local",
+         "engineVersion": "webR 0.6.0",
+         "locale": "en_US.UTF-8;C;en_US.UTF-8;en_US.UTF-8;en_US.UTF-8;C",
+         "rPackageVersions": Object {
+           "R6": "2.6.1",
+           "RColorBrewer": "1.1-3",
+           "S7": "0.2.2",
+           "base": "4.6.0",
+           "bit": "4.6.0",
+           "bit64": "4.8.2",
+           "cli": "3.6.6",
+           "clipr": "0.8.1",
+           "cpp11": "0.5.5",
+           "crayon": "1.5.3",
+           "datasets": "4.6.0",
+           "dplyr": "1.2.1",
+           "farver": "2.1.2",
+           "generics": "0.1.4",
+           "ggplot2": "4.0.3",
+           "glue": "1.8.1",
+           "grDevices": "4.6.0",
+           "graphics": "4.6.0",
+           "gtable": "0.3.6",
+           "hms": "1.1.4",
+           "isoband": "0.3.0",
+           "jsonlite": "2.0.0",
+           "labeling": "0.4.3",
+           "lifecycle": "1.0.5",
+           "magrittr": "2.0.5",
+           "methods": "4.6.0",
+           "pillar": "1.11.1",
+           "pkgconfig": "2.0.3",
+           "prettyunits": "1.2.0",
+           "progress": "1.2.3",
+           "purrr": "1.2.2",
+           "readr": "2.2.0",
+           "rlang": "1.2.0",
+           "scales": "1.4.0",
+           "stats": "4.6.0",
+           "stringi": "1.8.7",
+           "stringr": "1.6.0",
+           "tibble": "3.3.1",
+           "tidyr": "1.3.2",
+           "tidyselect": "1.2.1",
+           "tools": "4.6.0",
+           "tzdb": "0.5.0",
+           "utf8": "1.2.6",
+           "utils": "4.6.0",
+           "vctrs": "0.7.3",
+           "viridisLite": "0.4.3",
+           "vroom": "1.7.1.9000",
+           "webr": "0.6.0",
+           "withr": "3.0.2",
+         },
+         "rVersion": "R version 4.6.0 (2026-04-24)",
+         "timeZone": "UTC",
+         "transferCodecVersion": "columnar-1",
+       },
+     },
+     "startedAt": "2026-10-24T18:25:51.065Z",
+     "status": "running",
+     "trigger": "analysis",
+     "warnings": Array [],
+     "workspaceId": "322c8ab4-603f-4bab-a3b1-148979c6fcb1",
+   },
+ }
```

# Test source

```ts
  125 |   page.on('worker', (worker) => {
  126 |     const entry = {url: worker.url(), closed: false};
  127 |     workers.push(entry);
  128 |     worker.on('close', () => {
  129 |       entry.closed = true;
  130 |     });
  131 |   });
  132 |   const url = await create(page);
  133 |   const nav = navOf(page);
  134 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  135 |   const sqlUrl = page.url();
  136 |   await enter(page, 'SELECT i, random() AS zufall FROM range(350) t(i)');
  137 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  138 |   await expect(page.locator('.result-grid tbody tr').first()).toBeVisible();
  139 |   const rows = await page.locator('.result-grid tbody td').allTextContents();
  140 |   const editor = page.getByRole('textbox', {name: 'Analysecode'});
  141 |   await editor.press('ControlOrMeta+End');
  142 |   await editor.press('End');
  143 |   await page.keyboard.insertText('\n-- erhalten');
  144 |   await editor.press('ControlOrMeta+s');
  145 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  146 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  147 |     timeout: 60000,
  148 |   });
  149 |   const rUrl = page.url();
  150 |   await enter(page, 'bleibt <- data.frame(wert=1:3); plot(bleibt$wert); cat("Sitzung bleibt")');
  151 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  152 |   await expect(page.locator('.r-plot img')).toBeVisible();
  153 |   await expect(
  154 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  155 |   ).toBeEnabled();
  156 |   const before = await sessionOf(page);
  157 |   const runtime = await runtimeOf(page);
  158 |   const count = workers.length;
  159 |   await settingsOf(page).click();
  160 |   await expect(page).toHaveURL(url + '/settings');
  161 |   await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  162 |   await page.getByLabel('Zeilennummern', {exact: true}).uncheck();
  163 |   await page.getByLabel('Zeilenumbruch', {exact: true}).check();
  164 |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  165 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  166 |   await expect(page).toHaveURL(sqlUrl);
  167 |   await expect(page.locator('.view-lines')).toHaveCSS('font-size', '18px');
  168 |   await expect(page.locator('.line-numbers')).toHaveCount(0);
  169 |   await expect(page.locator('.result-grid tbody td')).toHaveText(rows);
  170 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  171 |   await editor.press('ControlOrMeta+z');
  172 |   await expect(page.locator('.view-lines')).not.toContainText('-- erhalten');
  173 |   await editor.press('ControlOrMeta+Shift+z');
  174 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  175 |   await editor.press('ControlOrMeta+s');
  176 |   await settingsOf(page).click();
  177 |   await page.goBack();
  178 |   await expect(page).toHaveURL(sqlUrl);
  179 |   await page.goForward();
  180 |   await expect(page).toHaveURL(url + '/settings');
  181 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  182 |   await expect(page).toHaveURL(rUrl);
  183 |   await expect(page.locator('.r-plot img')).toBeVisible();
  184 |   await expect(
  185 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  186 |   ).toBeEnabled();
  187 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
  188 |   expect(await runtimeOf(page)).toEqual(runtime);
  189 |   const after = await sessionOf(page);
  190 |   expect(after.id).toBe(before.id);
  191 |   expect(after.document.runs).toEqual(before.document.runs);
  192 |   expect(after.document.results).toEqual(before.document.results);
  193 |   expect(workers).toHaveLength(count);
  194 |   expect(workers.every((worker) => !worker.closed)).toBe(true);
  195 |   await expect(page.locator('.app-error')).toHaveCount(0);
  196 | });
  197 |
  198 | for (const kind of ['sql', 'r'] as const) {
  199 |   test(
  200 |     'Project settings: active ' +
  201 |       kind.toUpperCase() +
  202 |       ' continues through settings and cancels after return',
  203 |     async ({page}) => {
  204 |       const url = await create(page);
  205 |       await navOf(page)
  206 |         .getByRole('button', {name: kind === 'sql' ? 'SQL' : 'R', exact: true})
  207 |         .click();
  208 |       const analysisUrl = page.url();
  209 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  210 |         timeout: 60000,
  211 |       });
  212 |       await enter(
  213 |         page,
  214 |         kind === 'sql'
  215 |           ? 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)'
  216 |           : 'while (TRUE) { sqrt(42) }',
  217 |       );
  218 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  219 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  220 |       const before = await sessionOf(page);
  221 |       expect(before.busy).not.toBeNull();
  222 |       await settingsOf(page).click();
  223 |       await expect(page).toHaveURL(url + '/settings');
  224 |       const during = await sessionOf(page);
> 225 |       expect(during.id).toBe(before.id);
      |                                    ^ Error: expect(received).toEqual(expected) // deep equality
  226 |       expect(during.document.runs).toEqual(before.document.runs);
  227 |       expect(during.busy).toBe(before.busy);
  228 |       await page.goBack();
  229 |       await expect(page).toHaveURL(analysisUrl);
  230 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  231 |       await expect(page.locator('.app-error')).toHaveCount(0);
  232 |       expect((await sessionOf(page)).id).toBe(before.id);
  233 |       await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  234 |       await expect.poll(async () => (await sessionOf(page)).busy).toBeNull();
  235 |       await expect(page.locator('.run-summary-message')).toHaveText('Ausführung abgebrochen');
  236 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  237 |         timeout: 60000,
  238 |       });
  239 |       await expect(page.locator('.app-error')).toHaveCount(0);
  240 |       // A real follow-up execution proves the cancelled engine can be used again.
  241 |       await enter(page, kind === 'sql' ? 'SELECT 42 AS weiter' : 'cat("WEITER_NACH_ABBRUCH")');
  242 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  243 |       if (kind === 'sql') await expect(page.locator('.result-grid tbody td')).toHaveText('42');
  244 |       else await expect(page.getByRole('log')).toContainText('WEITER_NACH_ABBRUCH');
  245 |     },
  246 |   );
  247 | }
  248 |
  249 | test('Project settings: writer lease and stored files survive cleanup while reader edits personal settings', async ({
  250 |   page,
  251 |   context,
  252 | }) => {
  253 |   const url = await create(page);
  254 |   const before = await sessionOf(page);
  255 |   await settingsOf(page).click();
  256 |   const reader = await context.newPage();
  257 |   await reader.goto(url + '/settings');
  258 |   await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  259 |   expect((await sessionOf(reader)).readOnly).toBe(true);
  260 |   await reader.getByLabel('Editor-Schriftgrösse').selectOption('19');
  261 |   await expect(reader.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  262 |   await page.evaluate(async () => {
  263 |     const root = await navigator.storage.getDirectory();
  264 |     const projects = await root.getDirectoryHandle('workspaces', {create: true});
  265 |     const current = await projects.getDirectoryHandle(location.pathname.split('/')[2]!, {
  266 |       create: true,
  267 |     });
  268 |     const writer = await (
  269 |       await current.getFileHandle('settings-protected.bin', {create: true})
  270 |     ).createWritable();
  271 |     await writer.write('active-project-file');
  272 |     await writer.close();
  273 |   });
  274 |   const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  275 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  276 |   await page
  277 |     .getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen', exact: true})
  278 |     .click();
  279 |   await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
  280 |   await expect(page.getByRole('dialog')).toHaveCount(0);
  281 |   await expect(storage.getByRole('status')).toHaveText('Es wurden keine Dateien bereinigt.');
  282 |   expect(
  283 |     await page.evaluate(async () => {
  284 |       const root = await navigator.storage.getDirectory();
  285 |       const projects = await root.getDirectoryHandle('workspaces');
  286 |       const current = await projects.getDirectoryHandle(location.pathname.split('/')[2]!);
  287 |       return (await (await current.getFileHandle('settings-protected.bin')).getFile()).text();
  288 |     }),
  289 |   ).toBe('active-project-file');
  290 |   expect((await sessionOf(page)).id).toBe(before.id);
  291 |   expect((await sessionOf(page)).readOnly).toBe(false);
  292 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  293 |   await expect(
  294 |     reader.getByText('Das Schreibrecht ist weiterhin belegt.', {exact: true}),
  295 |   ).toBeVisible();
  296 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  297 |   await page
  298 |     .getByRole('menuitem', {name: 'Projekte verwalten und gezielt löschen', exact: true})
  299 |     .click();
  300 |   await expect(page).toHaveURL(/\/projects$/);
  301 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  302 |   await expect(
  303 |     reader.getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', {
  304 |       exact: true,
  305 |     }),
  306 |   ).toBeVisible();
  307 |   await expect(reader).toHaveURL(url + '/settings');
  308 |   expect((await sessionOf(reader)).readOnly).toBe(false);
  309 | });
  310 |
```

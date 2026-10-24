# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: active R continues through settings and cancels after return
- Location: tests/e2e/project-settings.spec.ts:225:3

# Error details

```
Error: expect(received).toBeNull()

Received: "R initialisieren"

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Test source

```ts
  163 |   await editor.press('ArrowLeft');
  164 |   const cursor = (await editorStateOf(page)).position;
  165 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  166 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  167 |     timeout: 60000,
  168 |   });
  169 |   const rUrl = page.url();
  170 |   await enter(page, 'bleibt <- data.frame(wert=1:3); plot(bleibt$wert); cat("Sitzung bleibt")');
  171 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  172 |   await expect(page.locator('.r-plot img')).toBeVisible();
  173 |   await expect(
  174 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  175 |   ).toBeEnabled();
  176 |   const before = await sessionOf(page);
  177 |   const runtime = await runtimeOf(page);
  178 |   const count = workers.length;
  179 |   await settingsOf(page).click();
  180 |   await expect(page).toHaveURL(url + '/settings');
  181 |   await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  182 |   await page.getByLabel('Zeilennummern', {exact: true}).uncheck();
  183 |   await page.getByLabel('Zeilenumbruch', {exact: true}).check();
  184 |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  185 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  186 |   await expect(page).toHaveURL(sqlUrl);
  187 |   await expect(page.locator('.view-lines')).toHaveCSS('font-size', '18px');
  188 |   expect(await editorStateOf(page)).toEqual({
  189 |     position: cursor,
  190 |     fontSize: 18,
  191 |     lineNumbers: 'off',
  192 |     wordWrap: 'on',
  193 |   });
  194 |   await expect(page.locator('.line-numbers')).toHaveCount(0);
  195 |   await expect(page.locator('.result-grid tbody td')).toHaveText(rows);
  196 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  197 |   await editor.press('ControlOrMeta+z');
  198 |   await expect(page.locator('.view-lines')).not.toContainText('-- erhalten');
  199 |   await editor.press('ControlOrMeta+Shift+z');
  200 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  201 |   await editor.press('ControlOrMeta+s');
  202 |   await settingsOf(page).click();
  203 |   await page.goBack();
  204 |   await expect(page).toHaveURL(sqlUrl);
  205 |   await page.goForward();
  206 |   await expect(page).toHaveURL(url + '/settings');
  207 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  208 |   await expect(page).toHaveURL(rUrl);
  209 |   await expect(page.locator('.r-plot img')).toBeVisible();
  210 |   await expect(
  211 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  212 |   ).toBeEnabled();
  213 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
  214 |   expect(await runtimeOf(page)).toEqual(runtime);
  215 |   const after = await sessionOf(page);
  216 |   expect(after.id).toBe(before.id);
  217 |   expect(after.document.runs).toEqual(before.document.runs);
  218 |   expect(after.document.results).toEqual(before.document.results);
  219 |   expect(workers).toHaveLength(count);
  220 |   expect(workers.every((worker) => !worker.closed)).toBe(true);
  221 |   await expect(page.locator('.app-error')).toHaveCount(0);
  222 | });
  223 |
  224 | for (const kind of ['sql', 'r'] as const) {
  225 |   test(
  226 |     'Project settings: active ' +
  227 |       kind.toUpperCase() +
  228 |       ' continues through settings and cancels after return',
  229 |     async ({page}) => {
  230 |       const url = await create(page);
  231 |       await navOf(page)
  232 |         .getByRole('button', {name: kind === 'sql' ? 'SQL' : 'R', exact: true})
  233 |         .click();
  234 |       const analysisUrl = page.url();
  235 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  236 |         timeout: 60000,
  237 |       });
  238 |       await enter(
  239 |         page,
  240 |         kind === 'sql'
  241 |           ? 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)'
  242 |           : 'while (TRUE) { sqrt(42) }',
  243 |       );
  244 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  245 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  246 |       await expect
  247 |         .poll(async () => Object.values((await sessionOf(page)).document.runs).at(-1)?.status)
  248 |         .toBe('running');
  249 |       const before = await sessionOf(page);
  250 |       expect(before.busy).not.toBeNull();
  251 |       await settingsOf(page).click();
  252 |       await expect(page).toHaveURL(url + '/settings');
  253 |       const during = await sessionOf(page);
  254 |       expect(during.id).toBe(before.id);
  255 |       expect(during.document.runs).toEqual(before.document.runs);
  256 |       expect(during.busy).toBe(before.busy);
  257 |       await page.goBack();
  258 |       await expect(page).toHaveURL(analysisUrl);
  259 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  260 |       await expect(page.locator('.app-error')).toHaveCount(0);
  261 |       expect((await sessionOf(page)).id).toBe(before.id);
  262 |       await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
> 263 |       await expect.poll(async () => (await sessionOf(page)).busy).toBeNull();
      |                                                                   ^ Error: expect(received).toBeNull()
  264 |       await expect(page.locator('.run-summary-message')).toHaveText('Ausführung abgebrochen');
  265 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  266 |         timeout: 60000,
  267 |       });
  268 |       await expect(page.locator('.app-error')).toHaveCount(0);
  269 |       // A real follow-up execution proves the cancelled engine can be used again.
  270 |       await enter(page, kind === 'sql' ? 'SELECT 42 AS weiter' : 'cat("WEITER_NACH_ABBRUCH")');
  271 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  272 |       if (kind === 'sql') await expect(page.locator('.result-grid tbody td')).toHaveText('42');
  273 |       else await expect(page.getByRole('log')).toContainText('WEITER_NACH_ABBRUCH');
  274 |     },
  275 |   );
  276 | }
  277 |
  278 | test('Project settings: writer lease and stored files survive cleanup while reader edits personal settings', async ({
  279 |   page,
  280 |   context,
  281 | }) => {
  282 |   const url = await create(page);
  283 |   const before = await sessionOf(page);
  284 |   await settingsOf(page).click();
  285 |   const reader = await context.newPage();
  286 |   await reader.goto(url + '/settings');
  287 |   await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  288 |   expect((await sessionOf(reader)).readOnly).toBe(true);
  289 |   await reader.getByLabel('Editor-Schriftgrösse').selectOption('19');
  290 |   await expect(reader.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  291 |   const files = await page.evaluate(async () => {
  292 |     const path = '/tests/spike/appServices.ts';
  293 |     const {services} = (await import(path)) as typeof import('../spike/appServices');
  294 |     const stored = await services.workspaces.create('Gespeichertes anderes Projekt');
  295 |     const root = await navigator.storage.getDirectory();
  296 |     const projects = await root.getDirectoryHandle('workspaces', {create: true});
  297 |     const files = [
  298 |       {
  299 |         workspace: location.pathname.split('/')[2]!,
  300 |         artifact: crypto.randomUUID(),
  301 |         content: 'active-project-file',
  302 |       },
  303 |       {
  304 |         workspace: stored.workspace.id,
  305 |         artifact: crypto.randomUUID(),
  306 |         content: 'stored-project-file',
  307 |       },
  308 |       {
  309 |         workspace: crypto.randomUUID(),
  310 |         artifact: crypto.randomUUID(),
  311 |         content: 'abandoned-project-file',
  312 |       },
  313 |     ];
  314 |     for (const file of files) {
  315 |       const directory = await projects.getDirectoryHandle(file.workspace, {create: true});
  316 |       const artifacts = await directory.getDirectoryHandle('artifacts', {create: true});
  317 |       const writer = await (
  318 |         await artifacts.getFileHandle(file.artifact, {create: true})
  319 |       ).createWritable();
  320 |       await writer.write(file.content);
  321 |       await writer.close();
  322 |     }
  323 |     return files;
  324 |   });
  325 |   const storage = page.getByRole('region', {name: 'Browser-Speicher'});
  326 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  327 |   await page
  328 |     .getByRole('menuitem', {name: 'Nicht referenzierte Projektreste bereinigen', exact: true})
  329 |     .click();
  330 |   await page.getByRole('button', {name: 'Bereinigung bestätigen', exact: true}).click();
  331 |   await expect(page.getByRole('dialog')).toHaveCount(0);
  332 |   await expect(storage.getByRole('status')).toHaveText('1 Dateien wurden bereinigt.');
  333 |   expect(
  334 |     await page.evaluate(async (files) => {
  335 |       const root = await navigator.storage.getDirectory();
  336 |       const projects = await root.getDirectoryHandle('workspaces');
  337 |       return Promise.all(
  338 |         files.map(async (file) => {
  339 |           const directory = await projects.getDirectoryHandle(file.workspace);
  340 |           const artifacts = await directory.getDirectoryHandle('artifacts');
  341 |           try {
  342 |             return (await (await artifacts.getFileHandle(file.artifact)).getFile()).text();
  343 |           } catch (error) {
  344 |             if (error instanceof DOMException && error.name === 'NotFoundError') return null;
  345 |             throw error;
  346 |           }
  347 |         }),
  348 |       );
  349 |     }, files),
  350 |   ).toEqual(['active-project-file', 'stored-project-file', null]);
  351 |   expect((await sessionOf(page)).id).toBe(before.id);
  352 |   expect((await sessionOf(page)).readOnly).toBe(false);
  353 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  354 |   await expect(
  355 |     reader.getByText('Das Schreibrecht ist weiterhin belegt.', {exact: true}),
  356 |   ).toBeVisible();
  357 |   await storage.getByRole('button', {name: 'Speicher verwalten', exact: true}).click();
  358 |   await page
  359 |     .getByRole('menuitem', {name: 'Projekte verwalten und gezielt löschen', exact: true})
  360 |     .click();
  361 |   await expect(page).toHaveURL(/\/projects$/);
  362 |   await reader.getByRole('button', {name: 'Schreibrecht erneut anfordern', exact: true}).click();
  363 |   await expect(
```

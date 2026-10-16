# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/projects.spec.ts >> Projects: a late real editor module preserves toolbar menu focus and its reset action
- Location: tests/e2e/projects.spec.ts:71:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('textbox', { name: 'Analysecode' })
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" getByRole('textbox', { name: 'Analysecode' }) with timeout 10000ms
  - waiting for getByRole('textbox', { name: 'Analysecode' })
    23 × locator resolved to <textarea wrap="off" tabindex="0" data-mprt="7" role="textbox" autocorrect="off" autocomplete="off" spellcheck="false" autocapitalize="off" aria-required="false" aria-multiline="true" aria-label="Analysecode" aria-autocomplete="both" aria-roledescription="editor" class="inputarea monaco-mouse-cursor-text"></textarea>
       - unexpected value "hidden"

```

```yaml
- banner:
  - img "Kanton Solothurn"
  - link "Datenwerkstatt":
    - /url: /projects
  - text: Entwicklungsstand · nicht abgenommen
- navigation "Hauptnavigation":
  - button "Navigation ausklappen"
  - link "Projekte":
    - /url: /projects
  - link "Übersicht":
    - /url: /projects/7d97b59c-2141-4c20-927d-f65ad4e57675
  - link "Daten":
    - /url: /projects/7d97b59c-2141-4c20-927d-f65ad4e57675/data
  - button "SQL"
  - button "R"
  - link "Einstellungen":
    - /url: /settings
- text: Lokal gespeichert · kein Backup Analysename
- textbox "Analysename": Neue SQL-Abfrage
- button "Ausführen"
- button "Speichern"
- button "Schema"
- status: SQL · Revision 0
- button "Weitere Aktionen" [expanded]
- menu "Weitere Aktionen":
  - menuitem "Arbeitsfläche zurücksetzen"
- group: Parameter (0)
- code:
  - textbox "Analysecode"
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
  16  | async function documentOf(page: Page) {
  17  |   return page.evaluate(
  18  |     async (path) => {
  19  |       const {services} = (await import(path)) as typeof import('../../src/app/services');
  20  |       const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  21  |       await session.flush();
  22  |       return {document: session.document, sessionId: session.sessionId};
  23  |     },
  24  |     await servicesModuleOf(page),
  25  |   );
  26  | }
  27  | 
  28  | async function servicesModuleOf(page: Page) {
  29  |   return page.evaluate(() => {
  30  |     // Vite may retain a cache-busting query in the app graph after earlier edits.
  31  |     // Import the exact loaded module, so assertions inspect the actual UI session.
  32  |     const entry = performance
  33  |       .getEntriesByType('resource')
  34  |       .find((entry) => new URL(entry.name).pathname === '/src/app/services.ts');
  35  |     if (!entry) throw new Error('Loaded application services module missing');
  36  |     return entry.name;
  37  |   });
  38  | }
  39  | 
  40  | async function importCsv(page: Page, filename: string, csv: string, replace = false) {
  41  |   await page.getByRole('link', {name: 'Daten', exact: true}).click();
  42  |   await page
  43  |     .getByRole('button', {name: replace ? 'Daten ersetzen' : 'Datei hinzufügen', exact: true})
  44  |     .click();
  45  |   await page.getByLabel('Datei (CSV oder Parquet, maximal 128 MiB)').setInputFiles({
  46  |     name: filename,
  47  |     mimeType: 'text/csv',
  48  |     buffer: Buffer.from(csv),
  49  |   });
  50  |   await page.getByRole('button', {name: 'Vorschau laden', exact: true}).click();
  51  |   await page.getByRole('button', {name: 'Import bestätigen', exact: true}).click();
  52  |   await expect(page.getByRole('dialog')).toHaveCount(0);
  53  | }
  54  | 
  55  | async function code(page: Page, value: string) {
  56  |   const input = page.getByRole('textbox', {name: 'Analysecode'});
  57  |   await page.locator('.monaco-editor').click();
  58  |   await input.press('ControlOrMeta+a');
  59  |   await page.keyboard.insertText(value);
  60  |   await input.press('ControlOrMeta+s');
  61  | }
  62  | 
  63  | function immutableHistory(document: WorkspaceDocument) {
  64  |   return {
  65  |     runs: document.runs,
  66  |     results: document.results,
  67  |     datasetVersions: document.datasetVersions,
  68  |   };
  69  | }
  70  | 
  71  | test('Projects: a late real editor module preserves toolbar menu focus and its reset action', async ({
  72  |   page,
  73  | }) => {
  74  |   await page.setViewportSize({width: 1440, height: 900});
  75  |   let releaseEditor: () => void = () => {};
  76  |   const editorGate = new Promise<void>((resolve) => {
  77  |     releaseEditor = resolve;
  78  |   });
  79  |   let moduleIntercepted = false;
  80  |   const deliveries: Promise<void>[] = [];
  81  |   const modulePattern = '**/src/ui/CodeEditorImpl.tsx*';
  82  |   const holdEditorModule = (route: Route) => {
  83  |     const delivery = (async () => {
  84  |       const response = await route.fetch();
  85  |       moduleIntercepted = true;
  86  |       await editorGate;
  87  |       await route.fulfill({response});
  88  |     })();
  89  |     deliveries.push(delivery);
  90  |     return delivery;
  91  |   };
  92  |   await page.route(modulePattern, holdEditorModule);
  93  |   try {
  94  |     await createProject(page, 'Verzögerter Editor');
  95  |     await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  96  |     await expect.poll(() => moduleIntercepted).toBe(true);
  97  |     await expect(page.getByText('Editor wird geladen …', {exact: true})).toBeVisible();
  98  |     await expect(page.locator('.monaco-editor')).toHaveCount(0);
  99  |     const splitter = page.getByRole('separator', {
  100 |       name: 'Grösse von Editor und Resultat ändern',
  101 |     });
  102 |     await expect(splitter).toHaveAttribute('aria-valuenow', '45');
  103 |     await splitter.focus();
  104 |     await splitter.press('ArrowDown');
  105 |     await expect(splitter).not.toHaveAttribute('aria-valuenow', '45');
  106 | 
  107 |     const trigger = page.getByRole('button', {name: 'Weitere Aktionen', exact: true});
  108 |     await trigger.click();
  109 |     const menu = page.getByRole('menu', {name: 'Weitere Aktionen', exact: true});
  110 |     const reset = menu.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen', exact: true});
  111 |     await expect(menu).toBeVisible();
  112 |     await expect(reset).toBeFocused();
  113 |     releaseEditor();
  114 | 
  115 |     await expect(page.locator('.monaco-editor')).toBeVisible();
> 116 |     await expect(page.getByRole('textbox', {name: 'Analysecode'})).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  117 |     await expect(page.getByText('Editor wird geladen …', {exact: true})).toHaveCount(0);
  118 |     await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  119 |     await expect(menu).toBeVisible();
  120 |     await expect(reset).toBeFocused();
  121 |     await reset.press('Enter');
  122 |     await expect(splitter).toHaveAttribute('aria-valuenow', '45');
  123 |     await expect(menu).toHaveCount(0);
  124 |     await expect(trigger).toBeFocused();
  125 |   } finally {
  126 |     releaseEditor();
  127 |     try {
  128 |       await Promise.all(deliveries);
  129 |     } finally {
  130 |       await page.unroute(modulePattern, holdEditorModule);
  131 |     }
  132 |   }
  133 | });
  134 | 
  135 | test('Projects: distinct overview/data pages preserve one session and live SQL/R workers across navigation', async ({
  136 |   page,
  137 | }, info) => {
  138 |   const workers: {url: string; closed: boolean}[] = [];
  139 |   page.on('worker', (worker) => {
  140 |     const record = {url: worker.url(), closed: false};
  141 |     workers.push(record);
  142 |     worker.on('close', () => {
  143 |       record.closed = true;
  144 |     });
  145 |   });
  146 |   const url = await createProject(page, 'Klares Projekt');
  147 |   const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  148 |   await expect(nav.getByRole('link', {name: 'Projekte', exact: true})).toBeVisible();
  149 |   await expect(nav.getByRole('link', {name: 'Übersicht', exact: true})).toHaveAttribute(
  150 |     'aria-current',
  151 |     'page',
  152 |   );
  153 |   await expect(page.getByLabel('Projektname', {exact: true})).toBeVisible();
  154 |   await expect(page.getByRole('heading', {name: 'Analysen', exact: true})).toBeVisible();
  155 |   await expect(page.getByRole('button', {name: 'Datei hinzufügen', exact: true})).toHaveCount(0);
  156 |   await expect(page.locator('.dataset-list')).toHaveCount(0);
  157 |   expect(workers).toEqual([]);
  158 |   const initial = await documentOf(page);
  159 | 
  160 |   await importCsv(page, 'messung.csv', 'id;wert\n1;10\n2;20\n');
  161 |   await expect(page).toHaveURL(`${url}/data`);
  162 |   await expect(page.getByRole('heading', {name: 'Daten', exact: true})).toBeVisible();
  163 |   await expect(page.getByLabel('Projektname', {exact: true})).toHaveCount(0);
  164 |   await expect(page.getByRole('button', {name: 'Projekt exportieren', exact: true})).toHaveCount(0);
  165 |   await expect(page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true})).toHaveCount(0);
  166 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  167 |   await expect(page.getByRole('region', {name: 'Datenübersicht'})).toContainText('messung');
  168 |   await expect(page.getByRole('region', {name: 'Datenübersicht'})).toContainText('2 Zeilen');
  169 |   await mkdir(evidence, {recursive: true});
  170 |   await page.screenshot({
  171 |     path: `${evidence}/${info.project.name}-project-overview.png`,
  172 |     fullPage: true,
  173 |   });
  174 |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  175 |   const sqlUrl = page.url();
  176 |   await code(page, 'SELECT sum(wert) AS summe FROM data.messung');
  177 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  178 |   await expect(page.locator('.result-grid tbody td')).toHaveText(['30']);
  179 |   await page.getByRole('button', {name: 'R', exact: true}).click();
  180 |   const rUrl = page.url();
  181 |   await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
  182 |   await code(page, 'merkzahl <- 73; cat(merkzahl)');
  183 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  184 |   await expect(page.getByRole('log')).toContainText('73');
  185 |   const before = await documentOf(page);
  186 |   expect(before.sessionId).toBe(initial.sessionId);
  187 |   const runtimeWorkers = workers.filter((worker) => !worker.url.includes('editor.worker'));
  188 |   expect(runtimeWorkers).toHaveLength(2);
  189 | 
  190 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  191 |   await page.getByRole('link', {name: 'Daten', exact: true}).click();
  192 |   await page.goBack();
  193 |   await expect(page).toHaveURL(url);
  194 |   await page.goForward();
  195 |   await expect(page).toHaveURL(`${url}/data`);
  196 |   await page.getByRole('button', {name: 'SQL', exact: true}).click();
  197 |   await expect(page).toHaveURL(sqlUrl);
  198 |   await expect(page.locator('.result-grid tbody td')).toHaveText(['30']);
  199 |   await page.getByRole('button', {name: 'R', exact: true}).click();
  200 |   await expect(page).toHaveURL(rUrl);
  201 |   await expect(page.getByRole('button', {name: /merkzahl · numeric/})).toBeVisible();
  202 |   const after = await documentOf(page);
  203 |   expect(after.sessionId).toBe(initial.sessionId);
  204 |   expect(immutableHistory(after.document)).toEqual(immutableHistory(before.document));
  205 |   expect(workers.filter((worker) => !worker.url.includes('editor.worker'))).toEqual(runtimeWorkers);
  206 |   expect(runtimeWorkers.every((worker) => !worker.closed)).toBe(true);
  207 | });
  208 | 
  209 | test('Projects: CSV replacement keeps both immutable versions with current/newest labels and readable origin/schema', async ({
  210 |   page,
  211 | }, info) => {
  212 |   await createProject(page, 'Datenstände');
  213 |   await importCsv(page, 'erste.csv', 'id;wert\n1;10\n');
  214 |   await importCsv(page, 'zweite.csv', 'id;wert;hinweis\n1;20;neu\n2;30;neu\n', true);
  215 |   const before = await documentOf(page);
  216 |   const datasets = Object.values(before.document.datasets);
```
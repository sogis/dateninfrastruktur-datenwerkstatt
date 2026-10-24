# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: active SQL continues through settings and cancels after return
- Location: tests/e2e/project-settings.spec.ts:225:3

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
    19 × locator resolved to <textarea wrap="off" tabindex="0" data-mprt="7" role="textbox" autocorrect="off" autocomplete="off" spellcheck="false" autocapitalize="off" aria-required="false" aria-multiline="true" aria-label="Analysecode" aria-autocomplete="both" aria-roledescription="editor" class="inputarea monaco-mouse-cursor-text"></textarea>
       - unexpected value "hidden"

```

```yaml
- banner:
  - link "Datenwerkstatt":
    - /url: /projects
- navigation "Hauptnavigation":
  - button "Navigation ausklappen"
  - link "Projekte":
    - /url: /projects
  - link "Übersicht":
    - /url: /projects/c8b072ac-17d9-42bb-87e5-fa1fa5e84a17
  - link "Daten":
    - /url: /projects/c8b072ac-17d9-42bb-87e5-fa1fa5e84a17/data
  - button "SQL"
  - tooltip "SQL mit DuckDB"
  - button "R"
  - link "Einstellungen":
    - /url: /projects/c8b072ac-17d9-42bb-87e5-fa1fa5e84a17/settings
  - link "Diagnose":
    - /url: /projects/c8b072ac-17d9-42bb-87e5-fa1fa5e84a17/diagnostics
- text: Analysename
- textbox "Analysename": Neue SQL-Abfrage
- button "Ausführen"
- button "Speichern"
- button "Schema"
- status: Revision 0
- button "Arbeitsfläche zurücksetzen"
- group: Parameter (0)
- code:
  - textbox "Analysecode": SELECT 1 AS wert;
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
  1   | import type {Page} from '@playwright/test';
  2   | import {test, expect} from '../persistentBrowser';
  3   |
  4   | const navOf = (page: Page) => page.getByRole('navigation', {name: 'Hauptnavigation'});
  5   | const settingsOf = (page: Page) =>
  6   |   navOf(page).getByRole('link', {name: 'Einstellungen', exact: true});
  7   |
  8   | async function create(page: Page) {
  9   |   await page.goto('/projects');
  10  |   await page.getByLabel('Name des neuen Projekts').fill('Einstellungen und Sitzung');
  11  |   await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  12  |   await expect(
  13  |     page.getByRole('heading', {name: 'Einstellungen und Sitzung', exact: true}),
  14  |   ).toBeVisible();
  15  |   return page.url();
  16  | }
  17  |
  18  | async function sessionOf(page: Page) {
  19  |   return page.evaluate(async () => {
  20  |     const path = '/tests/spike/appServices.ts';
  21  |     const {services} = (await import(path)) as typeof import('../spike/appServices');
  22  |     const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  23  |     return {
  24  |       id: session.sessionId,
  25  |       readOnly: session.readOnly,
  26  |       document: session.document,
  27  |       busy: session.scheduler.getSnapshot(),
  28  |     };
  29  |   });
  30  | }
  31  |
  32  | async function runtimeOf(page: Page) {
  33  |   return page.evaluate(async () => {
  34  |     const path = '/tests/spike/appServices.ts';
  35  |     const {services} = (await import(path)) as typeof import('../spike/appServices');
  36  |     const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  37  |     const runtimePath = '/src/infrastructure/monaco/runtime.ts';
  38  |     const {monaco} = (await import(
  39  |       runtimePath
  40  |     )) as typeof import('../../src/infrastructure/monaco/runtime');
  41  |     return {
  42  |       scope: session.getR().scope,
  43  |       epoch: session.getR().epoch,
  44  |       models: monaco.editor.getModels().map((model) => ({id: model.id, uri: model.uri.toString()})),
  45  |     };
  46  |   });
  47  | }
  48  |
  49  | async function enter(page: Page, value: string) {
> 50  |   await expect(page.getByRole('textbox', {name: 'Analysecode'})).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  51  |   const input = page.getByRole('textbox', {name: 'Analysecode'});
  52  |   await input.press('ControlOrMeta+a');
  53  |   await page.keyboard.insertText(value);
  54  |   await input.press('ControlOrMeta+s');
  55  | }
  56  |
  57  | async function editorStateOf(page: Page) {
  58  |   return page.evaluate(async () => {
  59  |     const path = '/src/infrastructure/monaco/runtime.ts';
  60  |     const {monaco} = (await import(
  61  |       path
  62  |     )) as typeof import('../../src/infrastructure/monaco/runtime');
  63  |     const editor = monaco.editor.getEditors().at(-1);
  64  |     if (!editor) throw Error('Active Monaco editor missing');
  65  |     const options = editor.getRawOptions();
  66  |     return {
  67  |       position: editor.getPosition(),
  68  |       fontSize: options.fontSize,
  69  |       lineNumbers: options.lineNumbers,
  70  |       wordWrap: options.wordWrap,
  71  |     };
  72  |   });
  73  | }
  74  |
  75  | test('Project settings: engine-free navigation, saved sidebar, global options, keyboard and responsive layout', async ({
  76  |   page,
  77  | }, info) => {
  78  |   const workers: string[] = [];
  79  |   page.on('worker', (worker) => workers.push(worker.url()));
  80  |   const url = await create(page);
  81  |   const before = await sessionOf(page);
  82  |   const nav = navOf(page);
  83  |   for (const label of ['Übersicht', 'Daten', 'Diagnose']) {
  84  |     await nav.getByRole('link', {name: label, exact: true}).click();
  85  |     const source = page.url();
  86  |     await page.keyboard.press('Tab');
  87  |     await settingsOf(page).focus();
  88  |     await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
  89  |     await settingsOf(page).press('Enter');
  90  |     await expect(page).toHaveURL(url + '/settings');
  91  |     await expect(settingsOf(page)).toHaveAttribute('aria-current', 'page');
  92  |     await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  93  |     await expect(nav.locator('.dw-nav-item')).toHaveCount(8);
  94  |     await expect(page.locator('.project-context')).toHaveText('Projekt: Einstellungen und Sitzung');
  95  |     await expect(
  96  |       page.getByText('Diese Einstellungen gelten für alle Projekte in diesem Browser.', {
  97  |         exact: true,
  98  |       }),
  99  |     ).toBeVisible();
  100 |     await expect(nav).toHaveCSS('width', '52px');
  101 |     expect((await sessionOf(page)).id).toBe(before.id);
  102 |     await page.goBack();
  103 |     await expect(page).toHaveURL(source);
  104 |     await page.goForward();
  105 |     await expect(page).toHaveURL(url + '/settings');
  106 |   }
  107 |   await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  108 |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  109 |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  110 |   await expect(nav).toHaveCSS('width', '212px');
  111 |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').check();
  112 |   await expect(nav).toHaveCSS('width', '212px');
  113 |   for (const width of [1440, 1280, 390]) {
  114 |     await page.setViewportSize({width, height: 900});
  115 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
  116 |       true,
  117 |     );
  118 |     await page.screenshot({
  119 |       path: info.outputPath('project-settings-' + width + '.png'),
  120 |       fullPage: true,
  121 |     });
  122 |   }
  123 |   await page.setViewportSize({width: 1280, height: 800});
  124 |   const style = await page.addStyleTag({content: 'html {font-size: 200%}'});
  125 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  126 |   await page.screenshot({path: info.outputPath('project-settings-text-200.png'), fullPage: true});
  127 |   await style.evaluate((element) => element.parentNode?.removeChild(element));
  128 |   await page.reload();
  129 |   await expect(nav).toHaveCSS('width', '212px');
  130 |   expect((await sessionOf(page)).id).not.toBe(before.id);
  131 |   expect(workers).toEqual([]);
  132 |   // The explicit global entry remains engine-free and has no implicit project.
  133 |   await page.goto('/settings');
  134 |   await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  135 |   await expect(page.locator('.project-context')).toHaveCount(0);
  136 |   expect(workers).toEqual([]);
  137 | });
  138 |
  139 | test('Project settings: real SQL/R results, model identity, undo, editor options and live scope survive', async ({
  140 |   page,
  141 | }) => {
  142 |   const workers: {url: string; closed: boolean}[] = [];
  143 |   page.on('worker', (worker) => {
  144 |     const entry = {url: worker.url(), closed: false};
  145 |     workers.push(entry);
  146 |     worker.on('close', () => {
  147 |       entry.closed = true;
  148 |     });
  149 |   });
  150 |   const url = await create(page);
```

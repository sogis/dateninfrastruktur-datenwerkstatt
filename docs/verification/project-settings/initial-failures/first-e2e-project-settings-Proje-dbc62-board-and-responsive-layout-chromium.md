# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: engine-free navigation, saved sidebar, global options, keyboard and responsive layout
- Location: tests/e2e/project-settings.spec.ts:57:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('tooltip', { name: 'Einstellungen', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('tooltip', { name: 'Einstellungen', exact: true }) with timeout 10000ms
  - waiting for getByRole('tooltip', { name: 'Einstellungen', exact: true })

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
    - /url: /projects/3c1fc559-681c-408b-97e2-59a909359b9d
  - link "Daten":
    - /url: /projects/3c1fc559-681c-408b-97e2-59a909359b9d/data
  - button "SQL"
  - button "R"
  - link "Einstellungen":
    - /url: /projects/3c1fc559-681c-408b-97e2-59a909359b9d/settings
  - link "Diagnose":
    - /url: /projects/3c1fc559-681c-408b-97e2-59a909359b9d/diagnostics
- heading "Einstellungen und Sitzung" [level=1]
- text: Projektname
- textbox "Projektname": Einstellungen und Sitzung
- text: Beschreibung (optional)
- textbox "Beschreibung"
- button "Speichern"
- region "Datenübersicht":
  - heading "Daten" [level=2]
  - link "Daten verwalten":
    - /url: /projects/3c1fc559-681c-408b-97e2-59a909359b9d/data
  - text: Noch keine Daten. Unter „Daten“ kannst du eine Datei oder eine Portalquelle hinzufügen.
- heading "Analysen" [level=2]
- button "Neue Analyse"
- text: Noch keine Analysen. Erstelle eine SQL-Abfrage oder ein R-Skript.
- list
- heading "Projektdatei und Speicher" [level=2]
- button "Projekt exportieren"
- button "Projektaktionen"
- status
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
  50  |   await expect(page.getByRole('textbox', {name: 'Analysecode'})).toBeVisible();
  51  |   const input = page.getByRole('textbox', {name: 'Analysecode'});
  52  |   await input.press('ControlOrMeta+a');
  53  |   await page.keyboard.insertText(value);
  54  |   await input.press('ControlOrMeta+s');
  55  | }
  56  |
  57  | test('Project settings: engine-free navigation, saved sidebar, global options, keyboard and responsive layout', async ({
  58  |   page,
  59  | }, info) => {
  60  |   const workers: string[] = [];
  61  |   page.on('worker', (worker) => workers.push(worker.url()));
  62  |   const url = await create(page);
  63  |   const before = await sessionOf(page);
  64  |   const nav = navOf(page);
  65  |   for (const label of ['Übersicht', 'Daten', 'Diagnose']) {
  66  |     await nav.getByRole('link', {name: label, exact: true}).click();
  67  |     const source = page.url();
  68  |     await settingsOf(page).focus();
> 69  |     await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
      |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  70  |     await settingsOf(page).press('Enter');
  71  |     await expect(page).toHaveURL(url + '/settings');
  72  |     await expect(settingsOf(page)).toHaveAttribute('aria-current', 'page');
  73  |     await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  74  |     await expect(nav.locator('.dw-nav-item')).toHaveCount(8);
  75  |     await expect(page.locator('.project-context')).toHaveText('Projekt: Einstellungen und Sitzung');
  76  |     await expect(
  77  |       page.getByText('Diese Einstellungen gelten für alle Projekte in diesem Browser.', {
  78  |         exact: true,
  79  |       }),
  80  |     ).toBeVisible();
  81  |     await expect(nav).toHaveCSS('width', '52px');
  82  |     expect((await sessionOf(page)).id).toBe(before.id);
  83  |     await page.goBack();
  84  |     await expect(page).toHaveURL(source);
  85  |     await page.goForward();
  86  |     await expect(page).toHaveURL(url + '/settings');
  87  |   }
  88  |   await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  89  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  90  |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  91  |   await expect(nav).toHaveCSS('width', '212px');
  92  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').check();
  93  |   await expect(nav).toHaveCSS('width', '212px');
  94  |   for (const width of [1440, 1280, 390]) {
  95  |     await page.setViewportSize({width, height: 900});
  96  |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
  97  |       true,
  98  |     );
  99  |     await page.screenshot({
  100 |       path: info.outputPath('project-settings-' + width + '.png'),
  101 |       fullPage: true,
  102 |     });
  103 |   }
  104 |   await page.setViewportSize({width: 1280, height: 800});
  105 |   const style = await page.addStyleTag({content: 'html {font-size: 200%}'});
  106 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  107 |   await page.screenshot({path: info.outputPath('project-settings-text-200.png'), fullPage: true});
  108 |   await style.evaluate((element) => element.remove());
  109 |   await page.reload();
  110 |   await expect(nav).toHaveCSS('width', '212px');
  111 |   expect((await sessionOf(page)).id).not.toBe(before.id);
  112 |   expect(workers).toEqual([]);
  113 |   // The explicit global entry remains engine-free and has no implicit project.
  114 |   await page.goto('/settings');
  115 |   await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  116 |   await expect(page.locator('.project-context')).toHaveCount(0);
  117 |   expect(workers).toEqual([]);
  118 | });
  119 |
  120 | test('Project settings: real SQL/R results, model identity, undo, editor options and live scope survive', async ({
  121 |   page,
  122 | }) => {
  123 |   const workers: {url: string; closed: boolean}[] = [];
  124 |   page.on('worker', (worker) => {
  125 |     const entry = {url: worker.url(), closed: false};
  126 |     workers.push(entry);
  127 |     worker.on('close', () => {
  128 |       entry.closed = true;
  129 |     });
  130 |   });
  131 |   const url = await create(page);
  132 |   const nav = navOf(page);
  133 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
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
```

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/p7-ui.spec.ts >> P7 AT-054–055 AT-058: measured SQL/R geometry, keyboard splitters, layout reset and reload
- Location: ../../../Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/tests/e2e/p7-ui.spec.ts:16:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.r-plot img')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.r-plot img') with timeout 10000ms
  - waiting for locator('.r-plot img')

```

```yaml
- banner:
  - img "Kanton Solothurn"
  - link "Datenwerkstatt":
    - /url: /workspaces
  - text: Entwicklungsstand · nicht abgenommen
- alert:
  - strong: The string did not match the expected pattern.
  - button "Hinweis schliessen"
- navigation "Hauptnavigation":
  - button "Navigation ausklappen"
  - link "Arbeitsbereiche":
    - /url: /workspaces
  - link "Projektübersicht":
    - /url: /workspaces/123bfa79-f3b0-4e5f-ad02-5538aa49d131
  - link "Daten":
    - /url: /workspaces/123bfa79-f3b0-4e5f-ad02-5538aa49d131/data
  - button "SQL"
  - button "R"
  - link "Einstellungen":
    - /url: /settings
- text: Lokal gespeichert · kein Backup Analysename
- textbox "Analysename": Neues R-Skript
- button "Ausführen"
- button "Speichern"
- button "Objekte / Eingaben" [pressed]
- button "Konsole" [pressed]
- button "Weitere Aktionen"
- group: Parameter (0)
- text: R-Lauf
- combobox "R-Lauf":
  - option "Letzter Lauf" [selected]
- text: Bereit · R-Epoche 0
- button "R initialisieren"
- complementary:
  - heading "Objekte" [level=3]
  - text: Scope nicht aktiv
  - heading "Eingaben" [level=3]
- code:
  - textbox "Analysecode": plot(1:4); cat("Gemessene R-Ausgabe")
- separator "R Editor und Ausgabe teilen"
- paragraph: Grafiken erscheinen nach einem erfolgreichen Lauf. Dataframes sind über die Objektliste erreichbar.
- separator "R Konsole teilen"
- log "R-Konsole":
  - paragraph: Ausgabe, Meldungen und Warnungen. print()/cat() für explizite Ausgabe verwenden.
- alert
- alert
```

# Test source

```ts
  1   | import {test, expect} from '../persistentBrowser';
  2   | import {mkdir, writeFile} from 'node:fs/promises';
  3   | import type {Page} from '@playwright/test';
  4   | async function create(page: Page) {
  5   |   await page.goto('/workspaces');
  6   |   await page.getByLabel('Name des neuen Arbeitsbereichs').fill('P7 Arbeitsfläche');
  7   |   await page.getByRole('button', {name: 'Neuer Arbeitsbereich', exact: true}).click();
  8   | }
  9   | async function enter(page: Page, text: string) {
  10  |   await page.locator('.monaco-editor').click();
  11  |   const input = page.getByRole('textbox', {name: 'Analysecode'});
  12  |   await input.press('ControlOrMeta+a');
  13  |   await page.keyboard.insertText(text);
  14  |   await input.press('ControlOrMeta+s');
  15  | }
  16  | test('P7 AT-054–055 AT-058: measured SQL/R geometry, keyboard splitters, layout reset and reload', async ({
  17  |   page,
  18  | }, info) => {
  19  |   await page.setViewportSize({width: 1440, height: 900});
  20  |   await create(page);
  21  |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  22  |   await enter(page, 'SELECT 77 AS wert');
  23  |   await page.getByRole('textbox', {name: 'Analysecode'}).press('ControlOrMeta+Enter');
  24  |   await expect(page.locator('.result-grid tbody td')).toHaveText(['77']);
  25  |   const sqlUrl = page.url();
  26  |   const geometry = [];
  27  |   for (const kind of ['sql', 'r']) {
  28  |     if (kind === 'r') {
  29  |       await page.getByRole('button', {name: 'R', exact: true}).click();
  30  |       await expect(page.locator('.run-status')).toContainText('Bereit', {timeout: 60000});
  31  |       await enter(page, 'plot(1:4); cat("Gemessene R-Ausgabe")');
  32  |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
> 33  |       await expect(page.locator('.r-plot img')).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  34  |       await expect(page.getByRole('log')).toContainText('Gemessene R-Ausgabe');
  35  |       await page.getByRole('button', {name: 'Grafik Vollbild', exact: true}).click();
  36  |       await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  37  |       const full = await page.locator('.r-plot').evaluate((el) => {
  38  |         const img = el.querySelector('img')!.getBoundingClientRect();
  39  |         const actions = el.querySelector('.dw-actions')!.getBoundingClientRect();
  40  |         return {
  41  |           imageBottom: img.bottom,
  42  |           actionsTop: actions.top,
  43  |           actionsBottom: actions.bottom,
  44  |           height: innerHeight,
  45  |         };
  46  |       });
  47  |       expect(full.imageBottom).toBeLessThanOrEqual(full.actionsTop);
  48  |       expect(full.actionsBottom).toBeLessThanOrEqual(full.height);
  49  |       await page.evaluate(() => document.exitFullscreen());
  50  |       const plotActions = await page
  51  |         .locator('.r-plot .dw-actions')
  52  |         .evaluate((el) => getComputedStyle(el).gap);
  53  |       expect(plotActions).toBe('8px');
  54  |       await page.getByRole('button', {name: 'Objekte / Eingaben'}).click();
  55  |     }
  56  |     for (const size of [
  57  |       {width: 1440, height: 900},
  58  |       {width: 1280, height: 800},
  59  |     ]) {
  60  |       await page.setViewportSize(size);
  61  |       await expect(page.locator('.code-editor')).toBeVisible();
  62  |       const box = await page.evaluate((kind) => {
  63  |         const rect = (selector: string) => {
  64  |           const b = document.querySelector(selector)!.getBoundingClientRect();
  65  |           return {x: b.x, y: b.y, width: b.width, height: b.height, bottom: b.bottom};
  66  |         };
  67  |         return {
  68  |           kind,
  69  |           viewport: {width: innerWidth, height: innerHeight},
  70  |           header: rect('header'),
  71  |           sidebar: rect('.sidebar'),
  72  |           toolbar: rect('.analysis-toolbar'),
  73  |           editor: rect('.code-editor'),
  74  |           area: rect(kind === 'sql' ? '.sql-panels' : '.r-panels'),
  75  |           output: rect(kind === 'sql' ? '.result-section' : '.r-output'),
  76  |           scrollWidth: document.documentElement.scrollWidth,
  77  |         };
  78  |       }, kind);
  79  |       expect(box.header.height).toBe(56);
  80  |       expect(box.sidebar.width).toBe(52);
  81  |       expect(box.toolbar.height).toBeLessThanOrEqual(88);
  82  |       expect(box.area.y - box.toolbar.y).toBeLessThanOrEqual(88);
  83  |       expect(box.area.height).toBeGreaterThanOrEqual(size.height * 0.75);
  84  |       expect(box.area.width).toBeGreaterThanOrEqual((size.width - box.sidebar.width) * 0.9);
  85  |       expect(box.scrollWidth).toBeLessThanOrEqual(size.width);
  86  |       expect(box.area.bottom).toBeLessThanOrEqual(size.height + 1);
  87  |       if (kind === 'sql')
  88  |         await expect(page.locator('.analysis-toolbar [role="status"]')).toHaveAttribute(
  89  |           'aria-live',
  90  |           'off',
  91  |         );
  92  |       if (kind === 'sql' && size.height === 900) {
  93  |         expect(box.editor.height).toBeGreaterThanOrEqual(180);
  94  |         expect(box.output.height).toBeGreaterThanOrEqual(220);
  95  |       }
  96  |       geometry.push(box);
  97  |       await mkdir('docs/verification/design-system', {recursive: true});
  98  |       await page.screenshot({
  99  |         path: `docs/verification/design-system/p7-${kind}-${info.project.name}-${size.width}.png`,
  100 |       });
  101 |     }
  102 |     const splitter = page.getByRole('separator', {
  103 |       name:
  104 |         kind === 'sql' ? 'Grösse von Editor und Resultat ändern' : 'R Editor und Ausgabe teilen',
  105 |     });
  106 |     await splitter.focus();
  107 |     const before = await splitter.getAttribute('aria-valuenow');
  108 |     await splitter.press(kind === 'sql' ? 'ArrowDown' : 'ArrowRight');
  109 |     await expect(splitter).not.toHaveAttribute('aria-valuenow', before!);
  110 |     const changed = await splitter.getAttribute('aria-valuenow');
  111 |     // Await actual separate view storage, not an arbitrary delay.
  112 |     await expect
  113 |       .poll(() =>
  114 |         page.evaluate(async (kind) => {
  115 |           const p = '/src/app/services.ts';
  116 |           const {services} = (await import(p)) as typeof import('../../src/app/services');
  117 |           const id = location.pathname.split(
  118 |             '/',
  119 |           )[2] as import('../../src/domain/model').WorkspaceId;
  120 |           const v = await services.views.load(id);
  121 |           return Math.round((kind === 'sql' ? v.sqlEditorFraction : v.rEditorFraction) * 100);
  122 |         }, kind),
  123 |       )
  124 |       .toBe(Number(changed));
  125 |     await page.reload();
  126 |     await expect(splitter).toHaveAttribute('aria-valuenow', changed!);
  127 |     await page.getByRole('button', {name: 'Weitere Aktionen', exact: true}).click();
  128 |     await page.getByRole('menuitem', {name: 'Arbeitsfläche zurücksetzen'}).click();
  129 |     await expect(splitter).toHaveAttribute('aria-valuenow', kind === 'sql' ? '45' : '50');
  130 |   }
  131 |   await writeFile(
  132 |     `docs/verification/design-system/p7-geometry-${info.project.name}.json`,
  133 |     JSON.stringify(geometry, null, 2),
```
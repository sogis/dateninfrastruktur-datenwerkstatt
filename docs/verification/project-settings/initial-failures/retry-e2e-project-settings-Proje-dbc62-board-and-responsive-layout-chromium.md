# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: engine-free navigation, saved sidebar, global options, keyboard and responsive layout
- Location: tests/e2e/project-settings.spec.ts:57:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
  68  |     await page.keyboard.press('Tab');
  69  |     await settingsOf(page).focus();
  70  |     await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
  71  |     await settingsOf(page).press('Enter');
  72  |     await expect(page).toHaveURL(url + '/settings');
  73  |     await expect(settingsOf(page)).toHaveAttribute('aria-current', 'page');
  74  |     await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  75  |     await expect(nav.locator('.dw-nav-item')).toHaveCount(8);
  76  |     await expect(page.locator('.project-context')).toHaveText('Projekt: Einstellungen und Sitzung');
  77  |     await expect(
  78  |       page.getByText('Diese Einstellungen gelten für alle Projekte in diesem Browser.', {
  79  |         exact: true,
  80  |       }),
  81  |     ).toBeVisible();
  82  |     await expect(nav).toHaveCSS('width', '52px');
  83  |     expect((await sessionOf(page)).id).toBe(before.id);
  84  |     await page.goBack();
  85  |     await expect(page).toHaveURL(source);
  86  |     await page.goForward();
  87  |     await expect(page).toHaveURL(url + '/settings');
  88  |   }
  89  |   await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  90  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  91  |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  92  |   await expect(nav).toHaveCSS('width', '212px');
  93  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').check();
  94  |   await expect(nav).toHaveCSS('width', '212px');
  95  |   for (const width of [1440, 1280, 390]) {
  96  |     await page.setViewportSize({width, height: 900});
> 97  |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      |                                                                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  98  |       true,
  99  |     );
  100 |     await page.screenshot({
  101 |       path: info.outputPath('project-settings-' + width + '.png'),
  102 |       fullPage: true,
  103 |     });
  104 |   }
  105 |   await page.setViewportSize({width: 1280, height: 800});
  106 |   const style = await page.addStyleTag({content: 'html {font-size: 200%}'});
  107 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  108 |   await page.screenshot({path: info.outputPath('project-settings-text-200.png'), fullPage: true});
  109 |   await style.evaluate((element) => element.parentNode?.removeChild(element));
  110 |   await page.reload();
  111 |   await expect(nav).toHaveCSS('width', '212px');
  112 |   expect((await sessionOf(page)).id).not.toBe(before.id);
  113 |   expect(workers).toEqual([]);
  114 |   // The explicit global entry remains engine-free and has no implicit project.
  115 |   await page.goto('/settings');
  116 |   await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  117 |   await expect(page.locator('.project-context')).toHaveCount(0);
  118 |   expect(workers).toEqual([]);
  119 | });
  120 |
  121 | test('Project settings: real SQL/R results, model identity, undo, editor options and live scope survive', async ({
  122 |   page,
  123 | }) => {
  124 |   const workers: {url: string; closed: boolean}[] = [];
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
```

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/navigation.spec.ts >> Navigation: settings follow R and leaving the workspace saves edits and its sidebar view
- Location: tests/e2e/navigation.spec.ts:57:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 56
Received: 0
```

# Test source

```ts
  30  |   await nav.getByRole('button', {name: 'Navigation ausklappen'}).press('Enter');
  31  |   await expect(nav).toHaveCSS('width', '212px');
  32  |   await expect(settings.locator('span')).toHaveText('Einstellungen');
  33  |   await nav.getByRole('link', {name: 'Projekte', exact: true}).click();
  34  |   await expect(page).toHaveURL(/\/projects$/);
  35  |   await expect(nav).toHaveCSS('width', '212px');
  36  |   await page.goBack();
  37  |   await expect(settings).toHaveAttribute('aria-current', 'page');
  38  |   await page.goForward();
  39  |   await expect(nav.getByRole('link', {name: 'Projekte', exact: true})).toHaveAttribute(
  40  |     'aria-current',
  41  |     'page',
  42  |   );
  43  |   await page.goto('/settings');
  44  |   await expect(nav).toHaveCSS('width', '52px');
  45  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  46  |   await expect(page.getByRole('status')).toHaveText('Einstellungen gespeichert');
  47  |   await page.reload();
  48  |   await expect(nav).toHaveCSS('width', '212px');
  49  |   await nav.getByRole('button', {name: 'Navigation einklappen'}).click();
  50  |   await nav.getByRole('link', {name: 'Projekte', exact: true}).click();
  51  |   await expect(nav).toHaveCSS('width', '52px');
  52  |   await page.reload();
  53  |   await expect(nav).toHaveCSS('width', '212px');
  54  |   expect(workers).toEqual([]);
  55  | });
  56  |
  57  | test('Navigation: settings follow R and leaving the workspace saves edits and its sidebar view', async ({
  58  |   page,
  59  | }, info) => {
  60  |   const errors: string[] = [];
  61  |   page.on('pageerror', (error) => errors.push(error.message));
  62  |   await page.goto('/projects');
  63  |   await page.getByLabel('Name des neuen Projekts').fill('Navigation und Autosave');
  64  |   await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  65  |   await expect(page.getByRole('heading', {name: 'Navigation und Autosave'})).toBeVisible();
  66  |   const nav = page.getByRole('navigation', {name: 'Hauptnavigation'});
  67  |   await expect(page.getByRole('navigation')).toHaveCount(1);
  68  |   expect(
  69  |     await nav
  70  |       .locator('.dw-nav-item')
  71  |       .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label'))),
  72  |   ).toEqual([
  73  |     'Navigation ausklappen',
  74  |     'Projekte',
  75  |     'Übersicht',
  76  |     'Daten',
  77  |     'SQL',
  78  |     'R',
  79  |     'Einstellungen',
  80  |     'Diagnose',
  81  |   ]);
  82  |   await nav.getByRole('button', {name: 'Navigation ausklappen'}).click();
  83  |   await page.getByLabel('Beschreibung', {exact: true}).fill('Beim Wechsel zuverlässig gespeichert');
  84  |   await nav.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  85  |   await expect(page).toHaveURL(/\/settings$/);
  86  |   await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  87  |   await page.goBack();
  88  |   await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
  89  |     'Beim Wechsel zuverlässig gespeichert',
  90  |   );
  91  |   await expect(nav).toHaveCSS('width', '212px');
  92  |   await page.reload();
  93  |   await expect(nav).toHaveCSS('width', '212px');
  94  |   for (const viewport of [
  95  |     {width: 1440, height: 900},
  96  |     {width: 1280, height: 800},
  97  |   ]) {
  98  |     await page.setViewportSize(viewport);
  99  |     for (const [label, selector] of [
  100 |       ['Übersicht', '.project-overview'],
  101 |       ['Daten', '.project-data-page'],
  102 |       ['SQL', '.sql-panels'],
  103 |       ['R', '.r-workbench'],
  104 |     ] as const) {
  105 |       const item = nav.getByRole(label === 'SQL' || label === 'R' ? 'button' : 'link', {
  106 |         name: label,
  107 |         exact: true,
  108 |       });
  109 |       await item.click();
  110 |       await expect(page.locator(selector)).toBeVisible();
  111 |       const content = page.locator('.workspace-content[data-save-state]');
  112 |       await expect(content).toHaveAttribute('data-save-state', 'saved');
  113 |       if (label === 'R')
  114 |         await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  115 |           timeout: 60000,
  116 |         });
  117 |       await expect(page.locator('.app-error, .workspace-content > .error')).toHaveCount(0);
  118 |       await expect(page.locator('.build-status, .save-status')).toHaveCount(0);
  119 |       await expect(
  120 |         page.getByText('Entwicklungsstand · nicht abgenommen', {exact: true}),
  121 |       ).toHaveCount(0);
  122 |       await expect(page.getByText('Lokal gespeichert · kein Backup', {exact: true})).toHaveCount(0);
  123 |       const geometry = await content.evaluate((section) => ({
  124 |         headerBottom: document.querySelector('.app-header')!.getBoundingClientRect().bottom,
  125 |         top: section.getBoundingClientRect().top,
  126 |         firstChildTop: section.firstElementChild!.getBoundingClientRect().top,
  127 |         overflow: document.documentElement.scrollWidth > innerWidth,
  128 |       }));
  129 |       expect(geometry.top).toBe(geometry.headerBottom);
> 130 |       expect(geometry.firstChildTop).toBe(geometry.top);
      |                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  131 |       expect(geometry.overflow).toBe(false);
  132 |       await writeFile(
  133 |         info.outputPath(`navigation-${label}-${viewport.width}.json`),
  134 |         JSON.stringify(geometry, null, 2),
  135 |       );
  136 |       await page.screenshot({path: info.outputPath(`navigation-${label}-${viewport.width}.png`)});
  137 |     }
  138 |   }
  139 |   expect(errors).toEqual([]);
  140 | });
  141 |
  142 | async function noticeGeometry(page: Page, info: TestInfo, name: string) {
  143 |   await page.mouse.move(0, 0);
  144 |   const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  145 |   await expect(close).toBeVisible();
  146 |   await expect(close).toHaveText('');
  147 |   await expect(close.locator('svg')).toHaveAttribute('viewBox', '0 0 16 16');
  148 |   await expect(close.locator('svg')).toHaveAttribute('focusable', 'false');
  149 |   const geometry = await close.evaluate((button) => {
  150 |     const banner = button.closest('.app-error')!;
  151 |     const text = banner.querySelector('.app-error-message')!;
  152 |     const rect = banner.getBoundingClientRect();
  153 |     const control = button.getBoundingClientRect();
  154 |     const icon = button.querySelector('svg')!.getBoundingClientRect();
  155 |     const label = text.getBoundingClientRect();
  156 |     const style = getComputedStyle(button);
  157 |     return {
  158 |       banner: {top: rect.top, bottom: rect.bottom, right: rect.right},
  159 |       control: {top: control.top, bottom: control.bottom, left: control.left, right: control.right},
  160 |       iconCenter: (icon.top + icon.bottom) / 2,
  161 |       text: {
  162 |         right: label.right,
  163 |         height: label.height,
  164 |         lineHeight: getComputedStyle(text).lineHeight,
  165 |         color: getComputedStyle(text).color,
  166 |         fontWeight: getComputedStyle(text).fontWeight,
  167 |       },
  168 |       color: style.color,
  169 |       iconColor: getComputedStyle(button.querySelector('svg')!).fill,
  170 |       background: style.backgroundColor,
  171 |       border: style.borderColor,
  172 |       width: style.width,
  173 |       height: style.height,
  174 |       overflow: document.documentElement.scrollWidth > innerWidth,
  175 |     };
  176 |   });
  177 |   expect(geometry.text.fontWeight).toBe('400');
  178 |   expect(geometry.text.color).toBe('rgb(180, 35, 24)');
  179 |   expect(geometry.color).toBe('rgb(91, 102, 115)');
  180 |   expect(geometry.iconColor).toBe(geometry.color);
  181 |   expect(geometry.background).toBe('rgba(0, 0, 0, 0)');
  182 |   expect(geometry.border).toBe('rgba(0, 0, 0, 0)');
  183 |   expect(geometry.width).toBe('40px');
  184 |   expect(geometry.height).toBe('40px');
  185 |   expect(
  186 |     Math.abs(geometry.iconCenter - (geometry.banner.top + geometry.banner.bottom) / 2),
  187 |   ).toBeLessThan(0.5);
  188 |   expect(geometry.control.left).toBeGreaterThan(geometry.text.right);
  189 |   expect(geometry.control.right).toBeLessThan(geometry.banner.right);
  190 |   expect(geometry.overflow).toBe(false);
  191 |   await writeFile(info.outputPath(`${name}.json`), JSON.stringify(geometry, null, 2));
  192 |   await page.screenshot({path: info.outputPath(`${name}.png`)});
  193 |   await close.hover();
  194 |   try {
  195 |     for (const [state, background] of [
  196 |       ['hover', 'rgb(254, 228, 226)'],
  197 |       ['active', 'rgb(254, 228, 226)'],
  198 |     ] as const) {
  199 |       if (state === 'active') await page.mouse.down();
  200 |       await expect(close).toHaveCSS('color', 'rgb(180, 35, 24)');
  201 |       await expect(close.locator('svg')).toHaveCSS('fill', 'rgb(180, 35, 24)');
  202 |       await expect(close).toHaveCSS('background-color', background);
  203 |       await page.screenshot({path: info.outputPath(`${name}-${state}.png`)});
  204 |     }
  205 |   } finally {
  206 |     // Release outside the button so checking :active does not dismiss the notice.
  207 |     await page.mouse.move(0, 0);
  208 |     await page.mouse.up();
  209 |   }
  210 |   await expect(close).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  211 |   return geometry;
  212 | }
  213 |
  214 | test('Notices: regular error text, neutral SVG and red interaction states with keyboard dismissal', async ({
  215 |   page,
  216 |   browserName,
  217 | }, info) => {
  218 |   await page.goto('/projects');
  219 |   await page.getByLabel('Projektdatei importieren').setInputFiles({
  220 |     name: 'defekt.dwproj',
  221 |     mimeType: 'application/zip',
  222 |     buffer: Buffer.from('invalid'),
  223 |   });
  224 |   await expect(page.getByRole('alert')).toContainText('ARCHIVE_INVALID');
  225 |   const close = page.getByRole('button', {name: 'Hinweis schliessen', exact: true});
  226 |   const viewports = [
  227 |     {width: 1440, height: 900},
  228 |     {width: 1280, height: 800},
  229 |   ];
  230 |   for (const viewport of viewports) {
```
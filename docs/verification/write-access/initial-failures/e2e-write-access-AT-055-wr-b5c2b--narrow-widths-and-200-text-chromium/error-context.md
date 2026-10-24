# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/write-access.spec.ts >> AT-055: write-access reason, retry and result fit narrow widths and 200% text
- Location: tests/e2e/write-access.spec.ts:271:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  197 | });
  198 |
  199 | test('AT-012: diagnostics update after a held retry and download only structured write-access facts', async ({
  200 |   page,
  201 |   context,
  202 | }) => {
  203 |   const url = await createProject(page);
  204 |   await page.getByLabel('Beschreibung', {exact: true}).fill('Private Beschreibung ohne Bericht');
  205 |   await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  206 |   await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
  207 |   const reader = await context.newPage();
  208 |   await readerFor(page, reader, `${url}/diagnostics`);
  209 |   const technical = reader.locator('.diagnostics-technical');
  210 |   await technical.locator('summary').click();
  211 |   await expect(technical).toContainText('Noch nicht angefordert');
  212 |   await reader.getByRole('button', {name: retryName, exact: true}).click();
  213 |   await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  214 |   await expect(technical).toContainText('Schreibrecht weiterhin belegt');
  215 |   await expect(technical).toContainText('Das Schreibrecht ist bereits belegt.');
  216 |   await expect(technical).toContainText('Verfügbar');
  217 |   await expect(technical.locator('time')).toHaveAttribute(
  218 |     'datetime',
  219 |     /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/,
  220 |   );
  221 |   // A raw technical error remains local UI feedback; it must not enter the report.
  222 |   await deferRetry(reader);
  223 |   await reader.getByRole('button', {name: retryName, exact: true}).click();
  224 |   await rejectRetry(reader);
  225 |   await expect(reader.locator('.workspace-write-access .dw-notice.dw-tone-danger')).toBeVisible();
  226 |   const downloading = reader.waitForEvent('download');
  227 |   await reader.getByRole('button', {name: 'Diagnosebericht herunterladen', exact: true}).click();
  228 |   const download = await downloading;
  229 |   expect(await download.failure()).toBeNull();
  230 |   const file = await download.path();
  231 |   if (!file) throw Error('The diagnostic download is missing.');
  232 |   const text = await readFile(file, 'utf8');
  233 |   const report: unknown = JSON.parse(text);
  234 |   expect(report).toMatchObject({
  235 |     readOnly: true,
  236 |     writeAccess: {
  237 |       reason: 'lock-held',
  238 |       webLocksAvailable: true,
  239 |       lastAttempt: {outcome: 'still-held', at: expect.any(String)},
  240 |     },
  241 |   });
  242 |   expect(text).not.toContain('Gezielter Fehler bei der Schreibrechtsprüfung');
  243 |   expect(text).not.toContain('Private Beschreibung ohne Bericht');
  244 |   expect(report).not.toHaveProperty('analyses');
  245 | });
  246 |
  247 | test('AT-012: a delayed retry failure after navigation does not appear in another project', async ({
  248 |   page,
  249 |   context,
  250 | }) => {
  251 |   const url = await createProject(page);
  252 |   const reader = await context.newPage();
  253 |   await readerFor(page, reader, url);
  254 |   await deferRetry(reader);
  255 |   await reader.getByRole('button', {name: retryName, exact: true}).click();
  256 |   await expect(
  257 |     reader.getByRole('button', {name: 'Schreibrecht wird geprüft …', exact: true}),
  258 |   ).toBeDisabled();
  259 |   await reader
  260 |     .getByRole('navigation', {name: 'Hauptnavigation'})
  261 |     .getByRole('link', {name: 'Projekte', exact: true})
  262 |     .click();
  263 |   await expect(reader).toHaveURL(/\/projects$/);
  264 |   await reader.getByLabel('Name des neuen Projekts').fill('Anderes Projekt');
  265 |   await reader.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  266 |   await expect(reader.getByRole('heading', {name: 'Anderes Projekt', exact: true})).toBeVisible();
  267 |   await rejectRetry(reader);
  268 |   await expect(reader.locator('.app-error')).toHaveCount(0);
  269 |   await expect(reader.getByText(/Gezielter Fehler bei der Schreibrechtsprüfung/)).toHaveCount(0);
  270 |   await expect(reader.getByLabel('Beschreibung', {exact: true})).toBeEnabled();
  271 |   expect(reader.url()).not.toBe(url);
  272 | });
  273 |
  274 | test('AT-055: write-access reason, retry and result fit narrow widths and 200% text', async ({
  275 |   page,
  276 |   context,
  277 | }, info) => {
  278 |   const url = await createProject(page);
  279 |   const reader = await context.newPage();
  280 |   await readerFor(page, reader, url);
  281 |   const retry = reader.getByRole('button', {name: retryName, exact: true});
  282 |   await retry.click();
  283 |   await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  284 |   for (const width of [390, 1280, 1440]) {
  285 |     await reader.setViewportSize({width, height: 900});
  286 |     await retry.scrollIntoViewIfNeeded();
  287 |     await expect(retry).toBeInViewport();
  288 |     const bounds = await retry.boundingBox();
  289 |     expect(bounds?.width).toBeGreaterThanOrEqual(40);
  290 |     expect(bounds?.height).toBeGreaterThanOrEqual(40);
  291 |     expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
  292 |       true,
  293 |     );
  294 |     await reader.screenshot({path: info.outputPath(`write-access-${width}.png`), fullPage: true});
  295 |   }
  296 |   await reader.addStyleTag({content: 'html { font-size: 200%; }'});
> 297 |   await reader.setViewportSize({width: 390, height: 900});
      |                                                                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  298 |   await retry.scrollIntoViewIfNeeded();
  299 |   await expect(retry).toBeInViewport();
  300 |   expect(await reader.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
  301 |     true,
  302 |   );
  303 |   await retry.focus();
  304 |   await retry.press('Enter');
  305 |   await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  306 |   await reader.screenshot({path: info.outputPath('write-access-390-text-200.png'), fullPage: true});
  307 | });
  308 |
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/write-access.spec.ts >> AT-012: held retry keeps the SQL reader view and keyboard promotion loads the latest project
- Location: tests/e2e/write-access.spec.ts:73:3

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', { exact: true })
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', { exact: true }) with timeout 10000ms
  - waiting for getByText('Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.', { exact: true })
    24 × locator resolved to <p id="_r_9_" role="status" tabindex="-1" aria-atomic="true" class="dw-action-status workspace-write-access-status">Schreibrecht erhalten. Der aktuelle Projektstand …</p>
       - unexpected value "inactive"

```

```yaml
- status: Schreibrecht erhalten. Der aktuelle Projektstand wurde geladen.
```

# Test source

```ts
  21  |     const path = '/tests/spike/appServices.ts';
  22  |     const {services} = (await import(path)) as typeof import('../spike/appServices');
  23  |     const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  24  |     return {
  25  |       sessionId: session.sessionId,
  26  |       readOnly: session.readOnly,
  27  |       document: session.document,
  28  |     };
  29  |   });
  30  | }
  31  |
  32  | async function readerFor(page: Page, reader: Page, url: string) {
  33  |   await reader.goto(url);
  34  |   await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  35  |   await expect(reader.getByRole('button', {name: retryName, exact: true})).toBeEnabled();
  36  |   expect((await sessionSnapshot(page)).readOnly).toBe(false);
  37  |   expect((await sessionSnapshot(reader)).readOnly).toBe(true);
  38  | }
  39  |
  40  | async function deferRetry(page: Page) {
  41  |   await page.evaluate(async () => {
  42  |     const path = '/tests/spike/appServices.ts';
  43  |     const {services} = (await import(path)) as typeof import('../spike/appServices');
  44  |     const original = services.workspaces.reacquire.bind(services.workspaces);
  45  |     let calls = 0;
  46  |     Reflect.set(globalThis, '__writeAccessRetryCalls', () => calls);
  47  |     services.workspaces.reacquire = (..._args: Parameters<typeof original>) => {
  48  |       calls++;
  49  |       return new Promise((_resolve, reject) => {
  50  |         Reflect.set(globalThis, '__rejectWriteAccessRetry', () =>
  51  |           reject(Error('Gezielter Fehler bei der Schreibrechtsprüfung')),
  52  |         );
  53  |       });
  54  |     };
  55  |     Reflect.set(globalThis, '__restoreWriteAccessRetry', () => {
  56  |       services.workspaces.reacquire = original;
  57  |     });
  58  |   });
  59  | }
  60  |
  61  | async function rejectRetry(page: Page) {
  62  |   await page.evaluate(() => {
  63  |     const reject: unknown = Reflect.get(globalThis, '__rejectWriteAccessRetry');
  64  |     const restore: unknown = Reflect.get(globalThis, '__restoreWriteAccessRetry');
  65  |     if (typeof reject !== 'function' || typeof restore !== 'function')
  66  |       throw Error('The deferred retry is missing.');
  67  |     restore();
  68  |     reject();
  69  |   });
  70  | }
  71  |
  72  | for (const kind of ['sql', 'r'] as const) {
  73  |   test(`AT-012: held retry keeps the ${kind.toUpperCase()} reader view and keyboard promotion loads the latest project`, async ({
  74  |     page,
  75  |     context,
  76  |   }) => {
  77  |     const projectUrl = await createProject(page);
  78  |     const analysisId = await page.evaluate(async (kind) => {
  79  |       const path = '/tests/spike/appServices.ts';
  80  |       const {services} = (await import(path)) as typeof import('../spike/appServices');
  81  |       const session = await services.workspaces.open(location.pathname.split('/')[2]!);
  82  |       const id = session.createAnalysis(kind);
  83  |       session.updateAnalysis(id, {
  84  |         name: 'Gesicherte Analyse',
  85  |         code: kind === 'sql' ? 'SELECT 7 AS wert;' : 'wert <- 7',
  86  |       });
  87  |       await session.flush();
  88  |       return id;
  89  |     }, kind);
  90  |     const url = `${projectUrl}/${kind}/${analysisId}`;
  91  |     const reader = await context.newPage();
  92  |     await readerFor(page, reader, url);
  93  |     await expect(reader.locator('.monaco-editor')).toBeVisible();
  94  |     await reader
  95  |       .getByRole('navigation', {name: 'Hauptnavigation'})
  96  |       .getByRole('button', {name: 'Navigation ausklappen', exact: true})
  97  |       .click();
  98  |     await expect(reader.locator('.sidebar')).toHaveCSS('width', '212px');
  99  |     const before = await sessionSnapshot(reader);
  100 |     const retry = reader.getByRole('button', {name: retryName, exact: true});
  101 |     await retry.focus();
  102 |     await retry.press('Enter');
  103 |     await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
  104 |     await expect(reader.locator('.workspace-write-access-status')).toHaveAttribute('role', 'status');
  105 |     await expect(reader.locator('.workspace-write-access-status')).toHaveAttribute('aria-atomic', 'true');
  106 |     await expect(retry).toBeEnabled();
  107 |     await expect(retry).toBeFocused();
  108 |     expect(reader.url()).toBe(url);
  109 |     expect(await sessionSnapshot(reader)).toEqual(before);
  110 |     await expect(reader.locator('.sidebar')).toHaveCSS('width', '212px');
  111 |     await expect(reader.getByLabel('Analysename', {exact: true})).toBeDisabled();
  112 |     await expect(reader.getByRole('button', {name: 'Ausführen', exact: true})).toBeDisabled();
  113 |     await page.getByLabel('Beschreibung', {exact: true}).fill('Neuester gespeicherter Stand');
  114 |     await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  115 |     await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
  116 |     await page.close();
  117 |     await reader.clock.install();
  118 |     await reader.clock.pauseAt(await reader.evaluate(() => Date.now() + 1000));
  119 |     await retry.focus();
  120 |     await retry.press('Space');
> 121 |     const success = reader.getByText(successText, {exact: true});
      |                           ^ Error: expect(locator).toBeFocused() failed
  122 |     await expect(success).toBeVisible();
  123 |     await expect(success).toBeFocused();
  124 |     await expect(reader.getByRole('button', {name: retryName, exact: true})).toHaveCount(0);
  125 |     expect(reader.url()).toBe(url);
  126 |     await expect(reader.getByLabel('Analysename', {exact: true})).toBeEnabled();
  127 |     const after = await sessionSnapshot(reader);
  128 |     expect(after.readOnly).toBe(false);
  129 |     expect(after.sessionId).not.toBe(before.sessionId);
  130 |     expect(after.document.workspace.description).toBe('Neuester gespeicherter Stand');
  131 |     expect(after.document.analyses[analysisId]?.code).toBe(
  132 |       before.document.analyses[analysisId]?.code,
  133 |     );
  134 |     expect(Object.keys(after.document.runs)).toHaveLength(0);
  135 |     await reader.clock.fastForward(2999);
  136 |     await expect(success).toBeVisible();
  137 |     await reader.clock.fastForward(1);
  138 |     await expect(success).toHaveCount(0);
  139 |   });
  140 | }
  141 |
  142 | test('AT-012: a single tab retains write access across page reloads', async ({page, context}) => {
  143 |   const url = await createProject(page);
  144 |   await page.getByLabel('Beschreibung', {exact: true}).fill('Nach Neuladen schreibbar');
  145 |   await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  146 |   await expect(page.locator('.workspace-content')).toHaveAttribute('data-save-state', 'saved');
  147 |   expect(context.pages().filter((item) => !item.isClosed())).toHaveLength(1);
  148 |   for (let attempt = 0; attempt < 2; attempt++) {
  149 |     await page.reload();
  150 |     await expect(page.getByLabel('Beschreibung', {exact: true})).toBeEnabled();
  151 |     await expect(page.getByLabel('Beschreibung', {exact: true})).toHaveValue(
  152 |       'Nach Neuladen schreibbar',
  153 |     );
  154 |     await expect(page.getByRole('button', {name: retryName, exact: true})).toHaveCount(0);
  155 |     expect(page.url()).toBe(url);
  156 |     expect((await sessionSnapshot(page)).readOnly).toBe(false);
  157 |   }
  158 | });
  159 |
  160 | test('AT-012: pending retry prevents duplicate activation and a technical failure keeps the reader usable', async ({
  161 |   page,
  162 |   context,
  163 | }) => {
  164 |   const url = await createProject(page);
  165 |   const reader = await context.newPage();
  166 |   await readerFor(page, reader, url);
  167 |   const before = await sessionSnapshot(reader);
  168 |   await deferRetry(reader);
  169 |   const retry = reader.getByRole('button', {name: retryName, exact: true});
  170 |   await retry.click();
  171 |   const pending = reader.getByRole('button', {name: 'Schreibrecht wird geprüft …', exact: true});
  172 |   await expect(pending).toBeDisabled();
  173 |   await expect(pending).toHaveAttribute('aria-busy', 'true');
  174 |   await pending.evaluate((button: HTMLButtonElement) => {
  175 |     button.click();
  176 |     button.click();
  177 |   });
  178 |   const calls = await reader.evaluate(() => {
  179 |     const count: unknown = Reflect.get(globalThis, '__writeAccessRetryCalls');
  180 |     if (typeof count !== 'function') throw Error('Retry counter is missing.');
  181 |     return count();
  182 |   });
  183 |   expect(calls).toBe(1);
  184 |   await rejectRetry(reader);
  185 |   const error = reader.locator('.workspace-write-access .dw-notice.dw-tone-danger');
  186 |   await expect(error).toBeVisible();
  187 |   await error.locator('summary').filter({hasText: 'Technische Details'}).click();
  188 |   await expect(error.getByText(/Gezielter Fehler bei der Schreibrechtsprüfung/)).toBeVisible();
  189 |   await expect(retry).toBeEnabled();
  190 |   expect(await sessionSnapshot(reader)).toEqual(before);
  191 |   await expect(reader.getByLabel('Beschreibung', {exact: true})).toBeDisabled();
  192 |   await expect(
  193 |     reader.getByRole('button', {name: 'Projekt exportieren', exact: true}),
  194 |   ).toBeEnabled();
  195 |   await retry.click();
  196 |   await expect(reader.getByText(heldText, {exact: true})).toBeVisible();
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
```
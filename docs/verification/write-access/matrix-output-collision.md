# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/navigation.spec.ts >> Navigation: settings follow R and leaving the workspace saves edits and its sidebar view
- Location: tests/e2e/navigation.spec.ts:57:1

# Error details

```
Error: browserContext.close: ENOENT: no such file or directory, open '/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/test-results/write-access-matrix/.playwright-artifacts-0/traces/3e99b8f6c3cad4665a83-386733114127d74db667-recording2.trace'
```

# Test source

```ts
  1  | import {test as base} from '@playwright/test';
  2  | import {mkdtemp, rm} from 'node:fs/promises';
  3  | import {join} from 'node:path';
  4  | import {tmpdir} from 'node:os';
  5  | import {isolateOpfs} from './isolateOpfs';
  6  | /** OPFS persistence acceptance uses fresh normal profiles, not private contexts. */
  7  | export const test = base.extend({
  8  |   page: async ({context}, use) => {
  9  |     const page = context.pages()[0] ?? (await context.newPage());
  10 |     await use(page);
  11 |   },
  12 |   context: async ({playwright, browserName}, use) => {
  13 |     const path = await mkdtemp(join(tmpdir(), 'datenwerkstatt-browser-'));
  14 |     const context = await playwright[browserName].launchPersistentContext(path, {
  15 |       headless: true,
  16 |       baseURL: 'http://127.0.0.1:4173',
  17 |       timezoneId: 'UTC',
  18 |     });
  19 |     const cleanup = await isolateOpfs(context);
  20 |     try {
  21 |       await use(context);
  22 |     } finally {
  23 |       try {
  24 |         await cleanup();
  25 |       } finally {
> 26 |         await context.close();
     |         ^ Error: browserContext.close: ENOENT: no such file or directory, open '/Users/stefan/sources/dateninfrastruktur/dateninfrastruktur-datenwerkstatt/test-results/write-access-matrix/.playwright-artifacts-0/traces/3e99b8f6c3cad4665a83-386733114127d74db667-recording2.trace'
  27 |         await rm(path, {recursive: true, force: true});
  28 |       }
  29 |     }
  30 |   },
  31 | });
  32 | export {expect} from '@playwright/test';
  33 |
```
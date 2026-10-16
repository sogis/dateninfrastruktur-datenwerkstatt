# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Projects: canonical deep routes reload under root/lab and retired workspace routes/assets return real 404
- Location: tests/deployment/projects.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.project-overview')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.project-overview') with timeout 15000ms
  - waiting for locator('.project-overview')

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
  - link "Einstellungen":
    - /url: /settings
- main:
  - heading "Projekte" [level=1]
  - text: Name des neuen Projekts
  - textbox "Name des neuen Projekts"
  - button "Neues Projekt"
  - paragraph: "* Pflichtfeld"
  - text: Projektdatei importieren
  - button "Projektdatei importieren"
  - button "Projekt öffnen"
  - text: Keine Datei ausgewählt
  - group: Wartung
  - table:
    - rowgroup:
      - row "Name Daten Analysen Zuletzt bearbeitet":
        - columnheader "Name"
        - columnheader "Daten"
        - columnheader "Analysen"
        - columnheader "Zuletzt bearbeitet"
    - rowgroup:
      - row "Projekt-Routen 0 2 16.10.2026, 04:56:25":
        - cell "Projekt-Routen":
          - link "Projekt-Routen":
            - /url: /projects/eaaa9e9b-1f7d-4be1-820f-5d55ca8943f2
        - cell "0"
        - cell "2"
        - cell "16.10.2026, 04:56:25"
```

# Test source

```ts
  1  | import {test, expect} from './fixture';
  2  | 
  3  | test('Projects: canonical deep routes reload under root/lab and retired workspace routes/assets return real 404', async ({
  4  |   page,
  5  |   request,
  6  |   baseURL,
  7  | }) => {
  8  |   await page.goto(baseURL!);
  9  |   await expect(page).toHaveURL(`${baseURL}projects`);
  10 |   await page.getByLabel('Name des neuen Projekts').fill('Projekt-Routen');
  11 |   await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  12 |   const overviewUrl = page.url();
  13 |   await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  14 |   const sqlUrl = page.url();
  15 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  16 |   await page.getByRole('button', {name: 'Neues R-Skript', exact: true}).click();
  17 |   const rUrl = page.url();
  18 |   await expect(page.locator('.r-workbench')).toBeVisible();
  19 |   // Persist both new drafts before testing full document navigation and reload.
  20 |   await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  21 |   await expect(page.getByText('Lokal gespeichert · kein Backup', {exact: true})).toBeVisible();
  22 | 
  23 |   for (const [url, selector] of [
  24 |     [overviewUrl, '.project-overview'],
  25 |     [`${overviewUrl}/data`, '.project-data-page'],
  26 |     [sqlUrl, '.sql-panels'],
  27 |     [rUrl, '.r-workbench'],
  28 |   ]) {
  29 |     const response = await request.get(url!);
  30 |     expect(response.status()).toBe(200);
  31 |     expect(response.headers()['content-type']).toContain('text/html');
  32 |     await page.goto(url!);
> 33 |     await expect(page.locator(selector!)).toBeVisible();
     |                                           ^ Error: expect(locator).toBeVisible() failed
  34 |     await page.reload();
  35 |     await expect(page.locator(selector!)).toBeVisible();
  36 |     await expect(page).toHaveURL(url!);
  37 |     await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  38 |   }
  39 |   const projectId = new URL(overviewUrl).pathname.split('/').at(-1)!;
  40 |   const analysisId = new URL(sqlUrl).pathname.split('/').at(-1)!;
  41 |   await page.getByRole('link', {name: 'Daten', exact: true}).click();
  42 |   await expect(page.locator('.project-data-page')).toBeVisible();
  43 |   await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  44 |   await expect(page.locator('.project-overview')).toBeVisible();
  45 |   await page.goBack();
  46 |   await expect(page.locator('.project-data-page')).toBeVisible();
  47 |   await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  48 |   await page.goForward();
  49 |   await expect(page.locator('.project-overview')).toBeVisible();
  50 |   await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  51 | 
  52 |   for (const [path, heading] of [
  53 |     ['projects/not-a-uuid', 'Projekt konnte nicht geöffnet werden'],
  54 |     ['projects/00000000-0000-4000-8000-000000000001', 'Projekt konnte nicht geöffnet werden'],
  55 |     [`projects/${projectId}/sql/not-a-uuid`, 'Analyse nicht gefunden'],
  56 |     [`projects/${projectId}/sql/00000000-0000-4000-8000-000000000001`, 'Analyse nicht gefunden'],
  57 |     [`projects/${projectId}/r/${analysisId}`, 'Analyse nicht gefunden'],
  58 |   ] as const) {
  59 |     await page.goto(`${baseURL}${path}`);
  60 |     await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible();
  61 |     await page.reload();
  62 |     await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible();
  63 |   }
  64 |   for (const path of [
  65 |     'workspaces',
  66 |     `workspaces/${projectId}`,
  67 |     `workspaces/${projectId}/data`,
  68 |     `workspaces/${projectId}/sql/${analysisId}`,
  69 |     `workspaces/${projectId}/r/${analysisId}`,
  70 |     'projects/missing.js',
  71 |     `projects/${projectId}/missing.wasm`,
  72 |     'missing/runtime-config.json',
  73 |   ]) {
  74 |     const response = await request.get(`${baseURL}${path}`);
  75 |     expect(response.status(), path).toBe(404);
  76 |     expect(await response.text(), path).not.toContain('<!doctype html>');
  77 |   }
  78 | });
  79 | 
```
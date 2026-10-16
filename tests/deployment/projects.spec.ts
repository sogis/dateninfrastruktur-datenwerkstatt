import {test, expect} from './fixture';

test('Projects: canonical deep routes reload under root/lab and retired workspace routes/assets return real 404', async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto(baseURL!);
  await expect(page).toHaveURL(`${baseURL}projects`);
  await page.getByLabel('Name des neuen Projekts').fill('Projekt-Routen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
  const overviewUrl = page.url();
  await page.getByRole('button', {name: 'Neue SQL-Abfrage', exact: true}).click();
  await expect(page).toHaveURL(/\/sql\/[0-9a-f-]+$/);
  const sqlUrl = page.url();
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await page.getByRole('button', {name: 'Neues R-Skript', exact: true}).click();
  await expect(page).toHaveURL(/\/r\/[0-9a-f-]+$/);
  await expect(page.locator('.r-workbench')).toBeVisible();
  const rUrl = page.url();
  // Persist both new drafts before testing full document navigation and reload.
  await page.getByRole('button', {name: 'Speichern', exact: true}).click();
  await expect(page.getByText('Lokal gespeichert · kein Backup', {exact: true})).toBeVisible();

  for (const [url, selector] of [
    [overviewUrl, '.project-overview'],
    [`${overviewUrl}/data`, '.project-data-page'],
    [sqlUrl, '.sql-panels'],
    [rUrl, '.r-workbench'],
  ]) {
    const response = await request.get(url!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    await page.goto(url!);
    await expect(page.locator(selector!)).toBeVisible();
    await page.reload();
    await expect(page.locator(selector!)).toBeVisible();
    await expect(page).toHaveURL(url!);
    await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  }
  const projectId = new URL(overviewUrl).pathname.split('/').at(-1)!;
  const analysisId = new URL(sqlUrl).pathname.split('/').at(-1)!;
  await page.getByRole('link', {name: 'Daten', exact: true}).click();
  await expect(page.locator('.project-data-page')).toBeVisible();
  await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
  await expect(page.locator('.project-overview')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.project-data-page')).toBeVisible();
  await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  await page.goForward();
  await expect(page.locator('.project-overview')).toBeVisible();
  await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);

  for (const [path, heading] of [
    ['projects/not-a-uuid', 'Projekt konnte nicht geöffnet werden'],
    ['projects/00000000-0000-4000-8000-000000000001', 'Projekt konnte nicht geöffnet werden'],
    [`projects/${projectId}/sql/not-a-uuid`, 'Analyse nicht gefunden'],
    [`projects/${projectId}/sql/00000000-0000-4000-8000-000000000001`, 'Analyse nicht gefunden'],
    [`projects/${projectId}/r/${analysisId}`, 'Analyse nicht gefunden'],
  ] as const) {
    await page.goto(`${baseURL}${path}`);
    await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', {name: heading, exact: true})).toBeVisible();
  }
  for (const path of [
    'workspaces',
    `workspaces/${projectId}`,
    `workspaces/${projectId}/data`,
    `workspaces/${projectId}/sql/${analysisId}`,
    `workspaces/${projectId}/r/${analysisId}`,
    'projects/missing.js',
    `projects/${projectId}/missing.wasm`,
    'missing/runtime-config.json',
  ]) {
    const response = await request.get(`${baseURL}${path}`);
    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).not.toContain('<!doctype html>');
  }
});

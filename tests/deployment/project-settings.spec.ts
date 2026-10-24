import {test, expect} from './fixture';

test('Project settings static route: direct load, reload, engine-free context and strict fallback', async ({
  page,
  request,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Deployment URL missing');
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto(baseURL + 'projects');
  await page.getByLabel('Name des neuen Projekts').fill('Statische Einstellungen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(
    page.getByRole('heading', {name: 'Statische Einstellungen', exact: true}),
  ).toBeVisible();
  const projectUrl = page.url();
  const link = page.getByRole('link', {name: 'Einstellungen', exact: true});
  await link.click();
  const url = projectUrl + '/settings';
  await expect(page).toHaveURL(url);
  await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  await page.goto(url);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Einstellungen', exact: true})).toBeVisible();
  await expect(page.getByLabel('Editor-Schriftgrösse')).toHaveValue('18');
  await expect(link).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('.sidebar .dw-nav-item')).toHaveCount(8);
  await expect(page.locator('.project-context')).toHaveText('Projekt: Statische Einstellungen');
  for (const target of [url, url + '/']) {
    const response = await request.get(target);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
  }
  for (const target of [url + '/extra', url + '.js', baseURL + 'vendor/absent.wasm']) {
    const response = await request.get(target);
    expect(response.status(), target).toBe(404);
    expect(await response.text()).not.toContain('<!doctype html>');
  }
  await page.screenshot({path: info.outputPath('project-settings-static.png'), fullPage: true});
  for (const id of ['not-a-uuid', '00000000-0000-4000-8000-000000000001']) {
    await page.goto(baseURL + 'projects/' + id + '/settings');
    await expect(
      page.getByRole('heading', {name: 'Projekt konnte nicht geöffnet werden', exact: true}),
    ).toBeVisible();
  }
  await page.goto(baseURL + 'settings');
  await expect(page.locator('.sidebar .dw-nav-item')).toHaveCount(3);
  await expect(page.locator('.project-context')).toHaveCount(0);
  expect(workers).toEqual([]);
});

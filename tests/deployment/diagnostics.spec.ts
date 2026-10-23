import {test, expect} from './fixture';

test('Diagnostics static route: direct load and reload with strict asset fallback', async ({
  page,
  request,
  baseURL,
}, info) => {
  if (!baseURL) throw Error('Deployment URL missing');
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto(`${baseURL}projects`);
  await expect(page.getByRole('link', {name: 'Diagnose', exact: true})).toHaveCount(0);
  await page.getByLabel('Name des neuen Projekts').fill('Statische Diagnose');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Statische Diagnose', exact: true})).toBeVisible();
  const projectUrl = page.url();
  const link = page.getByRole('link', {name: 'Diagnose', exact: true});
  await link.click();
  const url = `${projectUrl}/diagnostics`;
  await expect(page).toHaveURL(url);
  await expect(link).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', {name: 'Diagnose', exact: true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Diagnose', exact: true})).toBeVisible();
  const projectContext = page.locator('.project-context');
  await expect(projectContext).toHaveText('Projekt: Statische Diagnose');
  const projectLink = projectContext.getByRole('link', {name: 'Statische Diagnose', exact: true});
  await expect(projectLink).toHaveAttribute('href', new URL(projectUrl).pathname);
  await expect(page.locator('.diagnostics-technical')).not.toHaveAttribute('open');
  expect(workers).toEqual([]);
  for (const target of [url, `${url}/`]) {
    const response = await request.get(target);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
  }
  for (const target of [
    `${url}/extra`,
    `${url}.js`,
    new URL('diagnostics', baseURL).href,
    new URL('vendor/absent.wasm', baseURL).href,
  ]) {
    const response = await request.get(target);
    expect(response.status(), target).toBe(404);
  }
  await page.screenshot({path: info.outputPath('diagnostics-static-lab.png'), fullPage: true});
  await projectLink.click();
  await expect(page).toHaveURL(projectUrl);
  await expect(page.getByRole('heading', {name: 'Statische Diagnose', exact: true})).toBeVisible();
});

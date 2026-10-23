import {test, expect} from '../deployment/fixture';
import {mkdir} from 'node:fs/promises';

const evidence = 'docs/verification/buttons-v1.3/assets';

test('Neutral assets: local fonts, SVG, licences and fallback under /lab/', async ({
  page,
  request,
  baseURL,
}) => {
  const external: string[] = [];
  const resources: string[] = [];
  page.on('request', (r) => {
    resources.push(r.url());
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(baseURL!).origin)
      external.push(r.url());
  });
  await page.goto(`${baseURL}projects`);
  await expect(page.getByRole('heading', {name: 'Projekte', exact: true})).toBeVisible();
  await expect(page.locator('.brand-placeholder')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('navigation', {name: 'Hauptnavigation'}).locator('svg')).toHaveCount(
    3,
  );
  const faces = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 16px "Source Sans 3"'),
      document.fonts.load('500 16px "Source Sans 3"'),
      document.fonts.load('600 16px "Source Sans 3"'),
      document.fonts.load('italic 400 16px "Source Sans 3"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
    return [...document.fonts].map((face) => ({
      family: face.family.replaceAll('"', ''),
      weight: face.weight,
      style: face.style,
      status: face.status,
    }));
  });
  expect(
    faces
      .filter((face) => face.family === 'Source Sans 3')
      .sort((a, b) => a.style.localeCompare(b.style)),
  ).toEqual([
    {family: 'Source Sans 3', weight: '200 900', style: 'italic', status: 'loaded'},
    {family: 'Source Sans 3', weight: '200 900', style: 'normal', status: 'loaded'},
  ]);
  expect(faces).toContainEqual({
    family: 'JetBrains Mono',
    weight: '400',
    style: 'normal',
    status: 'loaded',
  });
  expect(resources.filter((url) => /Frutiger|kanton-solothurn/.test(url))).toEqual([]);
  const fontUrls = resources.filter((url) => /\.woff2(?:\?|$)/.test(url));
  expect(fontUrls).toHaveLength(3);
  for (const url of fontUrls) {
    expect(url.startsWith(baseURL!)).toBe(true);
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('font/woff2');
    expect((await response.body()).length).toBeGreaterThan(1000);
  }
  for (const path of [
    'licenses/ui-assets.json',
    'licenses/original-notices/source-sans-3.052R-OFL.txt',
    'licenses/original-notices/bootstrap-icons-1.13.1.txt',
    'licenses/original-notices/jetbrains-mono-2.304-OFL.txt',
  ]) {
    const response = await request.get(`${baseURL}${path}`);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain('<!doctype html>');
  }
  const manifest = await (await request.get(`${baseURL}licenses/ui-assets.json`)).text();
  expect(manifest).toContain('SourceSans3VF-Upright.ttf.woff2');
  expect(manifest).toContain('SourceSans3VF-Italic.ttf.woff2');
  expect(manifest).toContain('3.052');
  const root = await request.get(baseURL!);
  const html = await root.text();
  expect(html).not.toContain('Frutiger');
  expect(html).not.toContain('tests/design-system');
  await mkdir(evidence, {recursive: true});
  await page.screenshot({path: `${evidence}/lab-assets.png`, fullPage: true});
  await page.route('**/*.woff2', (route) => route.abort());
  await page.reload();
  await page.evaluate(() =>
    Promise.all([...document.fonts].map((face) => face.load().catch(() => undefined))),
  );
  expect(
    await page.evaluate(() => [...document.fonts].every((face) => face.status === 'error')),
  ).toBe(true);
  const name = page.getByLabel('Name des neuen Projekts', {exact: true});
  await name.fill('Systemfont-Ausweichschrift');
  await expect(name).toHaveValue('Systemfont-Ausweichschrift');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).focus();
  await expect(page.getByRole('button', {name: 'Neues Projekt', exact: true})).toBeFocused();
  await expect(page.getByRole('navigation', {name: 'Hauptnavigation'}).locator('svg')).toHaveCount(
    3,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(external).toEqual([]);
  await page.screenshot({path: `${evidence}/lab-fallback.png`, fullPage: true});
});

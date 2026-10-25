import {test, expect} from '../persistentBrowser';
import type {Locator, Page} from '@playwright/test';
import {openSqlParameters} from '../ui/sqlActions';

async function openParameters(page: Page, language: 'SQL' | 'R' = 'SQL') {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts', {exact: true}).fill('Parametervalidierung');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await page.getByRole('button', {name: 'Neue Analyse', exact: true}).click();
  await page
    .getByRole('menuitem', {
      name: language === 'SQL' ? 'Neue SQL-Abfrage' : 'Neues R-Skript',
      exact: true,
    })
    .click();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  if (language === 'SQL') await openSqlParameters(page);
  else await page.locator('.parameters > summary').click();
  return page.locator('.parameters-editor');
}

async function addParameter(editor: Locator, index: number, name: string) {
  await editor.getByRole('button', {name: 'Parameter hinzufügen', exact: true}).click();
  await editor.getByLabel(`Parameter ${index} Name`, {exact: true}).fill(name);
  await editor.getByLabel(`Parameter ${index} Typ`, {exact: true}).selectOption('boolean');
}

for (const language of ['SQL', 'R'] as const) {
  test(`Parameters ${language}: type changes reset only the affected value until edit/blur or apply`, async ({
    page,
  }) => {
    const editor = await openParameters(page, language);
    await addParameter(editor, 1, 'betrag');
    await addParameter(editor, 2, 'weiterer');
    const type = editor.getByLabel('Parameter 1 Typ', {exact: true});
    const value = editor.getByLabel('Parameter 1 Wert', {exact: true});
    const other = editor.getByLabel('Parameter 2 Wert', {exact: true});
    const apply = editor.getByRole('button', {name: 'Parameter übernehmen', exact: true});
    const row = editor.locator('tbody tr').first();
    const rowTop = (await value.boundingBox())!.y;
    await apply.click();
    await expect(value).toHaveAccessibleDescription('Bitte gib true oder false ein.');
    for (const control of await row.locator('input, button').all()) {
      expect((await control.boundingBox())!.y).toBeCloseTo(rowTop, 0);
    }
    const typeBox = (await type.boundingBox())!;
    const valueBox = (await value.boundingBox())!;
    expect(typeBox.y + typeBox.height / 2).toBeCloseTo(valueBox.y + valueBox.height / 2, 0);
    await expect(other).toHaveAttribute('aria-invalid', 'true');
    await type.selectOption('decimal');
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await expect(value).not.toHaveAttribute('aria-describedby');
    await expect(other).toHaveAccessibleDescription('Bitte gib true oder false ein.');
    await value.focus();
    await type.focus();
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await apply.click();
    await expect(value).toHaveAccessibleDescription(/Dezimalzahl/);
    await type.selectOption('boolean');
    await type.selectOption('decimal');
    await value.fill('ungültig');
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await type.focus();
    await expect(value).toHaveAccessibleDescription(/Dezimalzahl/);
    await value.fill('');
    await type.selectOption('string');
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await expect(value).not.toHaveAttribute('required');
    await expect(value).toHaveAccessibleDescription('(optional)');
    await type.selectOption('null');
    await expect(value).toBeDisabled();
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await type.selectOption('decimal');
    await value.fill('12345678901234567890.125');
    await expect(value).not.toHaveAttribute('aria-invalid', 'true');
    await other.fill('false');
    await apply.click();
    if (language === 'SQL') await expect(page.getByRole('dialog')).toHaveCount(0);
    else await expect(apply).toBeDisabled();
    const parameters = await page.evaluate(async () => {
      const path = '/tests/spike/appServices.ts';
      const {services} = (await import(path)) as typeof import('../spike/appServices');
      const session = await services.workspaces.open(location.pathname.split('/')[2]!);
      return Object.values(session.document.analyses)[0]!.parameters;
    });
    expect(parameters).toEqual({
      betrag: {type: 'decimal', value: '12345678901234567890.125'},
      weiterer: false,
    });
  });
}

for (const {label, width, fontSize} of [
  {label: 'desktop', width: 1440, fontSize: 16},
  {label: 'narrow', width: 390, fontSize: 16},
  {label: 'large text', width: 1280, fontSize: 32},
]) {
  test(`Parameters geometry: ${label} keeps controls aligned and stationary when errors appear`, async ({
    page,
  }, info) => {
    await page.setViewportSize({width, height: 900});
    const editor = await openParameters(page);
    await addParameter(editor, 1, 'betrag');
    await page.addStyleTag({content: `html {font-size: ${fontSize}px;}`});
    const row = editor.locator('tbody tr').first();
    const controls = row.locator('input, select, button');
    const geometry = () =>
      controls.evaluateAll((elements) =>
        elements.map((element) => {
          const {top, bottom, height} = element.getBoundingClientRect();
          return {top, bottom, height};
        }),
      );
    const initial = await geometry();
    const dialog = page.getByRole('dialog', {name: 'Parameter', exact: true});
    const dialogTop = (await dialog.boundingBox())!.y;
    const apply = editor.getByRole('button', {name: 'Parameter übernehmen', exact: true});
    await apply.click();
    const value = editor.getByLabel('Parameter 1 Wert', {exact: true});
    await expect(value).toHaveAccessibleDescription('Bitte gib true oder false ein.');
    for (const type of ['boolean', 'decimal']) {
      if (type === 'decimal') {
        await editor.getByLabel('Parameter 1 Typ', {exact: true}).selectOption(type);
        await apply.click();
        await expect(value).toHaveAccessibleDescription(/Dezimalzahl/);
      }
      const current = await geometry();
      for (const [index, rect] of current.entries()) {
        expect(Math.abs(rect.top - initial[index]!.top)).toBeLessThanOrEqual(1);
        if (index === 1) {
          expect(
            Math.abs(rect.top + rect.height / 2 - current[0]!.top - current[0]!.height / 2),
          ).toBeLessThanOrEqual(1);
        } else {
          expect(Math.abs(rect.top - current[0]!.top)).toBeLessThanOrEqual(1);
          expect(Math.abs(rect.height - current[0]!.height)).toBeLessThanOrEqual(1);
        }
      }
      expect((await dialog.boundingBox())!.y).toBeCloseTo(dialogTop, 0);
      const error = row.locator('.dw-field-error');
      expect((await error.boundingBox())!.y).toBeGreaterThanOrEqual(current[2]!.bottom);
      if (type === 'decimal' && label !== 'desktop') {
        const lines = await error.evaluate(
          (element) =>
            element.getBoundingClientRect().height /
            parseFloat(getComputedStyle(element).lineHeight),
        );
        expect(lines).toBeGreaterThan(1);
      }
      await page.screenshot({path: info.outputPath(`${label}-${type}.png`)});
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (label === 'large text') {
      for (let index = 2; index <= 10; index++) {
        await addParameter(editor, index, `wert_${index}`);
      }
      expect(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
        true,
      );
      expect((await dialog.boundingBox())!.y).toBeCloseTo(dialogTop, 0);
      await editor.getByLabel('Parameter 10 Wert', {exact: true}).scrollIntoViewIfNeeded();
      await expect(editor.getByLabel('Parameter 10 Wert', {exact: true})).toBeInViewport();
    }
    await dialog.getByRole('button', {name: 'Abbrechen', exact: true}).click();
    await expect(dialog).toHaveCount(0);
  });
}

async function nativeSelectPresentation(control: Locator) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      tag: element.tagName,
      appearance: style.appearance,
      font: style.font,
      padding: style.padding,
      borderRadius: style.borderRadius,
      height: element.getBoundingClientRect().height,
    };
  });
}

async function clippedFocusRing(control: Locator) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    const rect = element.getBoundingClientRect();
    const ring = {
      left: rect.left - extent,
      right: rect.right + extent,
      top: rect.top - extent,
      bottom: rect.bottom + extent,
    };
    const clipped: string[] = [];
    if (ring.left < 0 || ring.top < 0 || ring.right > innerWidth || ring.bottom > innerHeight)
      clipped.push('viewport');
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = getComputedStyle(parent);
      const clip = parent.getBoundingClientRect();
      const left = clip.left + parent.clientLeft;
      const top = clip.top + parent.clientTop;
      if (
        /auto|scroll|hidden|clip/.test(parentStyle.overflowX) &&
        (ring.left < left - 1 || ring.right > left + parent.clientWidth + 1)
      )
        clipped.push(`${parent.className}: horizontal`);
      if (
        /auto|scroll|hidden|clip/.test(parentStyle.overflowY) &&
        (ring.top < top - 1 || ring.bottom > top + parent.clientHeight + 1)
      )
        clipped.push(`${parent.className}: vertical`);
    }
    return {visible: element.matches(':focus-visible'), extent, clipped};
  });
}

test('Parameters native select and focus: settings appearance and complete keyboard rings across two rows', async ({
  page,
}, info) => {
  for (const {label, width, fontSize} of [
    {label: 'desktop', width: 1440, fontSize: 16},
    {label: 'narrow', width: 390, fontSize: 16},
    {label: 'large-text', width: 1280, fontSize: 32},
  ]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('/settings');
    await page.addStyleTag({content: `html {font-size: ${fontSize}px;}`});
    const settingsSelect = page.getByRole('combobox', {name: 'Editor-Schriftgrösse', exact: true});
    await expect(settingsSelect).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const settingsPresentation = await nativeSelectPresentation(settingsSelect);
    const editor = await openParameters(page);
    await addParameter(editor, 1, 'betrag');
    await addParameter(editor, 2, 'weiterer');
    await page.addStyleTag({content: `html {font-size: ${fontSize}px;}`});
    await page.evaluate(() => document.fonts.ready);
    const type = editor.getByLabel('Parameter 1 Typ', {exact: true});
    expect(await nativeSelectPresentation(type)).toEqual(settingsPresentation);
    const first = editor.getByLabel('Parameter 1 Name', {exact: true});
    const second = editor.getByLabel('Parameter 2 Name', {exact: true});
    const firstBox = (await first.boundingBox())!;
    const secondBox = (await second.boundingBox())!;
    const typeBox = (await type.boundingBox())!;
    expect(typeBox.x - firstBox.x - firstBox.width).toBeGreaterThanOrEqual(16);
    expect(secondBox.y - firstBox.y - firstBox.height).toBeGreaterThanOrEqual(16);
    if (label !== 'desktop')
      expect(
        await editor
          .locator('.parameter-table-scroll')
          .evaluate((element) => element.scrollWidth > element.clientWidth),
      ).toBe(true);
    for (const state of ['clean', 'errors']) {
      if (state === 'errors') {
        await editor.getByRole('button', {name: 'Parameter übernehmen', exact: true}).click();
        await expect(editor.locator('.dw-field-error')).toHaveCount(2);
      }
      const controls = await editor.locator('tbody input, tbody select, tbody button').all();
      await first.focus();
      for (const [index, control] of controls.entries()) {
        if (index) await page.keyboard.press('Tab');
        await expect(control).toBeFocused();
        await expect
          .poll(() => clippedFocusRing(control))
          .toEqual({visible: true, extent: 5, clipped: []});
      }
      await page.screenshot({path: info.outputPath(`${label}-${state}-focus.png`)});
    }
  }
});

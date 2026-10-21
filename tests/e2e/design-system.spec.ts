import {test, expect} from '../persistentBrowser';
import {mkdir, writeFile} from 'node:fs/promises';
import type {Locator, Page} from '@playwright/test';
const evidence = 'docs/verification/neutral-v1.2';
const tooltipEvidence = 'docs/verification/neutral-v1.2/tooltips';
async function tooltipGeometry(trigger: Locator) {
  return trigger.evaluate((control) => {
    const tooltip = control.parentElement!.querySelector<HTMLElement>('[role="tooltip"]')!;
    const anchor = control.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    return {
      anchor: {left: anchor.left, right: anchor.right, top: anchor.top, bottom: anchor.bottom},
      tip: {left: tip.left, right: tip.right, top: tip.top, bottom: tip.bottom},
      viewport: {width: innerWidth, height: innerHeight},
    };
  });
}
async function expectRightCentered(trigger: Locator) {
  await expect
    .poll(async () => {
      const {anchor, tip} = await tooltipGeometry(trigger);
      return (
        Math.abs(tip.left - anchor.right - 8) +
        Math.abs((tip.top + tip.bottom - anchor.top - anchor.bottom) / 2)
      );
    })
    .toBeLessThan(0.005);
}
// DOMRect subtraction in Firefox can differ by less than 0.0001 CSS px.
// Assert geometry to 0.005 px; the CSS spacing contract stays exactly 8 px.
async function gaps(group: Locator) {
  return group.locator(':scope > button').evaluateAll((elements) =>
    elements.map((el) => {
      const r = el.getBoundingClientRect();
      return {left: r.left, right: r.right, top: r.top, bottom: r.bottom};
    }),
  );
}
async function capture(page: Page, name: string) {
  await mkdir(evidence, {recursive: true});
  await page.screenshot({path: `${evidence}/${name}.png`, fullPage: true});
}
test('UI components: labels, native submit, checkbox, errors, busy state, menu and dialog keyboard', async ({
  page,
  browser,
}, info) => {
  test.setTimeout(30_000);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/tests/design-system/');
  await page.evaluate(() => document.fonts.ready);
  const name = page.getByRole('textbox', {name: 'Projektname', exact: true});
  await name.fill('Referenzprojekt');
  await expect(name).toHaveAttribute('required');
  await expect(name).toHaveAccessibleDescription('Ein eindeutiger Name für das Projekt.');
  await page.getByText('Originaldatei behalten', {exact: true}).click();
  await expect(page.getByRole('checkbox', {name: 'Originaldatei behalten'})).toBeChecked();
  await expect(page.getByRole('textbox', {name: /Ein langes Label/})).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByRole('textbox', {name: /Ein langes Label/})).toHaveAccessibleDescription(
    /Der angegebene Name/,
  );
  await page.getByRole('button', {name: 'Vorschau', exact: true}).click();
  await expect(page.getByLabel('Formularstatus')).toHaveText('0 gesendet');
  await page.getByRole('button', {name: 'Formular senden'}).click();
  await expect(page.getByLabel('Formularstatus')).toHaveText('1 gesendet');
  await expect(page.getByRole('button', {name: 'Wird gespeichert'})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Wird gespeichert'})).toHaveAttribute(
    'aria-busy',
    'true',
  );
  const trigger = page.getByRole('button', {name: 'Weitere Aktionen'});
  await trigger.focus();
  await trigger.press('ArrowUp');
  await expect(page.getByRole('menuitem', {name: 'Letzte Aktion'})).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', {name: 'Erste Aktion'})).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', {name: 'Letzte Aktion'})).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Aktionsstatus')).toHaveText('Erste Aktion');
  const open = page.getByRole('button', {name: 'Dialog öffnen'});
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  const buttons = await gaps(dialog.locator('.dw-dialog-footer'));
  expect(buttons[1]!.left - buttons[0]!.right).toBeCloseTo(8, 2);
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  const sql = page.getByRole('button', {name: 'SQL', exact: true});
  await sql.focus();
  await expect(page.getByRole('tooltip', {name: 'SQL · DuckDB'})).toBeVisible();
  await expect(sql).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip', {name: 'SQL · DuckDB'})).not.toBeVisible();
  await page.getByRole('button', {name: 'R', exact: true}).hover();
  await expect(page.getByRole('tooltip', {name: 'R · webR'})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => [...document.fonts].find((font) => font.family.includes('JetBrains Mono'))?.status,
    ),
  ).toBe('loaded');
  expect(
    await page.evaluate(() =>
      [...document.fonts]
        .filter((font) => font.family.includes('Source Sans 3'))
        .map((font) => ({weight: font.weight, style: font.style, status: font.status}))
        .sort((a, b) => a.style.localeCompare(b.style)),
    ),
  ).toEqual([
    {weight: '200 900', style: 'italic', status: 'loaded'},
    {weight: '200 900', style: 'normal', status: 'loaded'},
  ]);
  expect(
    await page
      .locator('body')
      .evaluate((el) => getComputedStyle(el).fontFamily.split(',')[0]?.replaceAll('"', '').trim()),
  ).toBe('Source Sans 3');
  await expect(page.locator('h1')).toHaveCSS('font-weight', '600');
  await expect(page.locator('.dw-table th.numeric')).toHaveCSS('text-align', 'end');
  await expect(page.locator('.dw-table td.numeric')).toHaveCSS('text-align', 'end');
  await expect(page.locator('label').filter({hasText: /^Projektname$/})).toHaveCSS(
    'font-weight',
    '500',
  );
  const roles = {
    primary: ['--dw-action-bg', '--dw-action-bg-hover', '--dw-action-bg-pressed'],
    secondary: ['--dw-surface', '--dw-surface-hover', '--dw-surface-pressed'],
    tertiary: [null, '--dw-surface-hover', '--dw-surface-pressed'],
  } as const;
  const token = (name: string) =>
    page.evaluate((property) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${property})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }, name);
  for (const tone of ['default', 'danger'] as const) {
    for (const variant of ['primary', 'secondary', 'tertiary'] as const) {
      const button = page.getByRole('button', {name: `${variant} ${tone}`, exact: true});
      await expect(button).toHaveCSS('font-weight', '500');
      const backgrounds =
        tone === 'danger'
          ? variant === 'primary'
            ? ['--dw-danger-bg', '--dw-danger-bg-hover', '--dw-danger-bg-pressed']
            : [
                variant === 'tertiary' ? null : '--dw-surface',
                '--dw-danger-subtle-hover',
                '--dw-danger-subtle-pressed',
              ]
          : roles[variant];
      await page.mouse.move(0, 0);
      await expect(button).toHaveCSS(
        'background-color',
        backgrounds[0] ? await token(backgrounds[0]) : 'rgba(0, 0, 0, 0)',
      );
      await button.hover();
      await expect(button).toHaveCSS('background-color', await token(backgrounds[1]!));
      await page.mouse.down();
      try {
        await expect(button).toHaveCSS('background-color', await token(backgrounds[2]!));
      } finally {
        await page.mouse.up();
      }
    }
  }
  await expect(page.getByRole('button', {name: 'primary default', exact: true})).toHaveCSS(
    'background-color',
    'rgb(43, 92, 138)',
  );
  for (const [message, foreground, background] of [
    ['Information: Die Vorschau zeigt die ersten 200 Zeilen.', '--dw-info-fg', '--dw-info-bg'],
    ['Erfolg: Lokal gespeichert.', '--dw-success-fg', '--dw-success-bg'],
    ['Warnung: Nur in dieser Sitzung verfügbar.', '--dw-warning-fg', '--dw-warning-bg'],
    ['Fehler: Die Datei konnte nicht gelesen werden.', '--dw-error-fg', '--dw-error-bg'],
  ]) {
    const notice = page.locator('.dw-notice').filter({hasText: message!});
    await expect(notice).toHaveCSS('color', await token(foreground!));
    await expect(notice).toHaveCSS('background-color', await token(background!));
  }
  await expect(page.getByRole('button', {name: 'Wird gespeichert', exact: true})).toHaveCSS(
    'color',
    await token('--dw-text'),
  );
  await expect(page.getByRole('textbox', {name: 'Schreibgeschützter Name'})).toHaveAttribute(
    'readonly',
  );
  await expect(page.getByRole('textbox', {name: 'Schreibgeschützter Name'})).toHaveCSS(
    'background-color',
    await token('--dw-surface-subtle'),
  );
  await expect(page.getByRole('textbox', {name: 'Deaktivierte Eingabe'})).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Deaktiviert', exact: true})).toHaveCSS(
    'color',
    await token('--dw-disabled-text'),
  );
  await page.keyboard.press('Tab');
  await name.focus();
  await expect(name).toHaveCSS('outline-color', await token('--dw-focus-ring'));
  await expect(name).toHaveCSS('outline-width', '3px');
  await expect(sql).toHaveCSS('background-color', await token('--dw-selection-bg'));
  const selected = await sql.evaluate((el) => {
    const style = getComputedStyle(el);
    return [
      style.boxShadow,
      style.borderColor,
      style.outlineColor,
      getComputedStyle(el, '::before').backgroundColor,
      getComputedStyle(el, '::before').borderColor,
    ].join(' ');
  });
  expect(selected).toContain(await token('--dw-selection-border'));
  const contrast = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const luminance = (token: string) => {
      const hex = styles.getPropertyValue(token).trim().replace('#', '');
      const linear = [0, 2, 4].map((start) => {
        const value = parseInt(hex.slice(start, start + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };
    return [
      ['--dw-text', '--dw-surface', 4.5],
      ['--dw-text-secondary', '--dw-surface-subtle', 4.5],
      ['--dw-action-fg', '--dw-action-bg', 4.5],
      ['--dw-selection-fg', '--dw-selection-bg', 4.5],
      ['--dw-disabled-text', '--dw-disabled-bg', 4.5],
      ['--dw-info-fg', '--dw-info-bg', 4.5],
      ['--dw-success-fg', '--dw-success-bg', 4.5],
      ['--dw-warning-fg', '--dw-warning-bg', 4.5],
      ['--dw-error-fg', '--dw-error-bg', 4.5],
      ['--dw-danger-fg', '--dw-danger-bg', 4.5],
      ['--dw-border-control', '--dw-surface', 3],
      ['--dw-border-control', '--dw-surface-subtle', 3],
      ['--dw-focus-ring', '--dw-surface', 3],
    ].map(([foreground, background, minimum]) => {
      const a = luminance(foreground as string),
        b = luminance(background as string);
      return {
        foreground,
        background,
        minimum: Number(minimum),
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
  });
  for (const pair of contrast)
    expect(pair.ratio, `${pair.foreground} on ${pair.background}`).toBeGreaterThanOrEqual(
      pair.minimum,
    );
  await capture(page, `components-${info.project.name}`);
  // Text-only enlargement exercises fixed-size controls independently of viewport scaling.
  await page.setViewportSize({width: 720, height: 450});
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>('body, body *')].map((el) => ({
      el,
      size: parseFloat(getComputedStyle(el).fontSize),
    }));
    for (const {el, size} of sizes) if (Number.isFinite(size)) el.style.fontSize = `${size * 2}px`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(720);
  for (const label of await page.locator('.dw-label').all()) {
    const typography = await label.evaluate((node) => {
      const style = getComputedStyle(node);
      return {size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight)};
    });
    expect(typography.line).toBeGreaterThanOrEqual(typography.size * 1.2);
  }
  const rows = await gaps(page.getByTestId('wrapped-actions'));
  for (let i = 1; i < rows.length; i++) {
    const previous = rows[i - 1]!,
      current = rows[i]!;
    expect(
      current.top === previous.top ? current.left - previous.right : current.top - previous.bottom,
    ).toBeGreaterThanOrEqual(7.99);
  }
  await capture(page, `components-${info.project.name}-text-200`);
  await page.route('**/*.woff2', (route) => route.abort());
  await page.reload();
  for (const label of [
    'Source Sans 3 400',
    'Source Sans 3 500',
    'Source Sans 3 600',
    'Source Sans 3 400 italic',
    'JetBrains Mono 400',
  ])
    await expect(page.getByLabel(`Fontstatus ${label}`, {exact: true})).toContainText(
      'Systemfont-Fallback',
    );
  await expect(page.getByRole('button', {name: 'primary default', exact: true})).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(720);
  const touch = await browser.newContext({hasTouch: true, viewport: {width: 720, height: 450}});
  try {
    const coarse = await touch.newPage();
    await coarse.goto('http://127.0.0.1:4173/tests/design-system/');
    expect(await coarse.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    for (const control of [
      coarse.getByRole('button', {name: 'primary default', exact: true}),
      coarse.getByRole('button', {name: 'Optionen', exact: true}),
      coarse.getByRole('button', {name: 'SQL', exact: true}),
    ]) {
      const bounds = (await control.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
  } finally {
    await touch.close();
  }
  await writeFile(`${evidence}/contrast.json`, JSON.stringify(contrast, null, 2));
  expect(
    requests.filter((url) => /^https?:/.test(url) && !url.startsWith('http://127.0.0.1:4173/')),
  ).toEqual([]);
  expect(requests.filter((url) => /duckdb|webr\/|workspaceService/.test(url))).toEqual([]);
  expect(requests.filter((url) => /Frutiger/.test(url))).toEqual([]);
  await capture(page, `components-${info.project.name}-fallback`);
});
test('UI tooltips: hover delay, cancellation, keyboard focus, ownership and unmount', async ({
  page,
  browserName,
}) => {
  const optionTab = browserName === 'webkit' && process.platform === 'darwin';
  const backTab = optionTab ? 'Alt+Shift+Tab' : 'Shift+Tab';
  await page.clock.install();
  await page.goto('/tests/design-system/');
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const sql = page.getByRole('button', {name: 'SQL', exact: true});
  const r = page.getByRole('button', {name: 'R', exact: true});
  const visible = page.locator('[role="tooltip"]:visible');
  await sql.hover();
  await page.clock.runFor(249);
  await expect(visible).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(visible).toHaveText('SQL · DuckDB');
  await expect(sql).toHaveAccessibleDescription('SQL · DuckDB');
  const {anchor, tip} = await tooltipGeometry(sql);
  expect(tip.left - anchor.right).toBeCloseTo(8, 2);
  // Crossing the transparent gap and hovering the tooltip must preserve it.
  await page.mouse.move(anchor.right + 4, (anchor.top + anchor.bottom) / 2);
  await page.clock.runFor(300);
  await expect(visible).toHaveText('SQL · DuckDB');
  await visible.hover();
  await page.clock.runFor(300);
  await expect(visible).toHaveText('SQL · DuckDB');
  await page.mouse.move(600, 100);
  await page.clock.runFor(119);
  await expect(visible).toHaveCount(1);
  await page.clock.runFor(1);
  await expect(visible).toHaveCount(0);
  await r.hover();
  await page.clock.runFor(200);
  await page.mouse.move(600, 100);
  await page.clock.runFor(300);
  await expect(visible).toHaveCount(0);
  await sql.hover();
  await page.clock.runFor(100);
  await r.hover();
  await page.clock.runFor(249);
  await expect(visible).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(visible).toHaveText('R · webR');
  await page.keyboard.press('Escape');
  await page.clock.runFor(300);
  await expect(visible).toHaveCount(0);
  await page.mouse.move(600, 100);
  await r.hover();
  await page.clock.runFor(250);
  await r.click();
  await page.clock.runFor(300);
  await expect(visible).toHaveCount(0);
  await r.press(backTab);
  await expect(sql).toBeFocused();
  await expect(visible).toHaveText('SQL · DuckDB');
  await page.mouse.move(600, 100);
  await page.clock.runFor(300);
  await expect(visible).toHaveText('SQL · DuckDB');
  await visible.hover();
  await page.getByRole('textbox', {name: 'Projektname', exact: true}).focus();
  await page.clock.runFor(300);
  await expect(visible).toHaveText('SQL · DuckDB');
  await page.mouse.move(600, 100);
  await page.clock.runFor(120);
  await expect(visible).toHaveCount(0);
  const toggle = page.getByRole('button', {name: 'Tooltip-Auslöser umschalten (100 ms)'});
  const options = page.getByRole('button', {name: 'Optionen', exact: true});
  await toggle.click();
  await options.hover();
  await page.clock.runFor(100);
  await expect(options).toHaveCount(0);
  await page.clock.runFor(300);
  await expect(visible).toHaveCount(0);
  await toggle.click();
  await page.clock.runFor(100);
  await expect(options).toBeVisible();
  await toggle.click();
  await toggle.press(backTab);
  await expect(options).toBeFocused();
  await expect(visible).toHaveText('Optionen der Arbeitsfläche');
  await page.clock.runFor(100);
  await expect(options).toHaveCount(0);
  await expect(visible).toHaveCount(0);
  await page.clock.resume();
});
test('UI tooltips: no misplaced frames, collapsed/expanded navigation, scroll and resize', async ({
  page,
}, info) => {
  await page.goto('/projects');
  await page.getByLabel('Name des neuen Projekts').fill('Tooltip-Geometrie');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Tooltip-Geometrie', exact: true})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const probe = {stopped: false, frames: [] as {count: number; invalid: boolean}[]};
    Reflect.set(window, '__tooltipFrames', probe);
    const sample = () => {
      if (probe.stopped) return;
      const visible = [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].filter(
        (tip) => {
          const style = getComputedStyle(tip);
          return style.display !== 'none' && style.visibility !== 'hidden';
        },
      );
      probe.frames.push({
        count: visible.length,
        invalid: visible.some((tip) => {
          const rect = tip.getBoundingClientRect();
          const anchor = tip.parentElement!.firstElementChild!.getBoundingClientRect();
          return (
            rect.left < 8 ||
            rect.top < 8 ||
            Math.abs(rect.left - anchor.right - 8) > 0.005 ||
            Math.abs((rect.top + rect.bottom - anchor.top - anchor.bottom) / 2) > 0.005
          );
        }),
      });
      if (!probe.stopped) requestAnimationFrame(sample);
    };
    document.addEventListener('pointerover', sample, {once: true, capture: true});
    requestAnimationFrame(sample);
  });
  const sql = page.getByRole('button', {name: 'SQL', exact: true});
  const r = page.getByRole('button', {name: 'R', exact: true});
  const visible = page.locator('[role="tooltip"]:visible');
  const measurements = [];
  await mkdir(tooltipEvidence, {recursive: true});
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(viewport);
    await sql.hover();
    await expect(visible).toHaveText('SQL · DuckDB');
    await expectRightCentered(sql);
    measurements.push({viewport, expanded: false, geometry: await tooltipGeometry(sql)});
    await page.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
    await expect(visible).toHaveCount(0);
    await sql.hover();
    await expect(visible).toHaveText('SQL · DuckDB');
    await expectRightCentered(sql);
    measurements.push({viewport, expanded: true, geometry: await tooltipGeometry(sql)});
    await page.screenshot({
      path: `${tooltipEvidence}/navigation-${info.project.name}-${viewport.width}.png`,
    });
    await r.hover();
    await expect(visible).toHaveText('R · webR');
    await expectRightCentered(r);
    await page.getByRole('button', {name: 'Navigation einklappen', exact: true}).click();
    await expect(visible).toHaveCount(0);
  }
  const frames = await page.evaluate(() => {
    const probe = Reflect.get(window, '__tooltipFrames') as {
      stopped: boolean;
      frames: {count: number; invalid: boolean}[];
    };
    probe.stopped = true;
    return probe.frames;
  });
  expect(frames.some((frame) => frame.count === 1)).toBe(true);
  expect(frames.filter((frame) => frame.count > 1 || frame.invalid)).toEqual([]);

  await page.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  await sql.hover();
  await expect(visible).toHaveText('SQL · DuckDB');
  await page.setViewportSize({width: 720, height: 300});
  await expectRightCentered(sql);
  const narrow = await tooltipGeometry(sql);
  expect(narrow.tip.bottom).toBeLessThanOrEqual(292);
  expect(narrow.tip.right).toBeLessThanOrEqual(712);
  measurements.push({viewport: {width: 720, height: 300}, expanded: true, geometry: narrow});
  await page.setViewportSize({width: 720, height: 450});
  await page.keyboard.press('Tab');
  await sql.focus();
  await page.mouse.move(600, 100);
  await expect(visible).toHaveText('SQL · DuckDB');
  const beforeScroll = await tooltipGeometry(sql);
  await page.evaluate(() => window.scrollBy(0, 100));
  await expectRightCentered(sql);
  const afterScroll = await tooltipGeometry(sql);
  expect(afterScroll.anchor.top).toBeLessThan(beforeScroll.anchor.top);
  expect(afterScroll.tip.top).toBeLessThan(beforeScroll.tip.top);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(visible).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(visible).toHaveCount(0);
  await writeFile(
    `${tooltipEvidence}/navigation-${info.project.name}.json`,
    JSON.stringify({measurements, frames}, null, 2),
  );
});
test('UI tooltips: shared IconButton flips at viewport edge and follows measured size', async ({
  page,
}, info) => {
  await page.goto('/tests/design-system/');
  await page.evaluate(() => document.fonts.ready);
  const options = page.getByRole('button', {name: 'Optionen', exact: true});
  await options.evaluate((button) =>
    Object.assign(button.parentElement!.style, {position: 'fixed', right: '8px', top: '200px'}),
  );
  await options.hover();
  const visible = page.locator('[role="tooltip"]:visible');
  await expect(visible).toHaveText('Optionen der Arbeitsfläche');
  await page.keyboard.press('Tab');
  await options.focus();
  await page.mouse.move(200, 100);
  for (const viewport of [
    {width: 1440, height: 900},
    {width: 720, height: 450},
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const {anchor, tip} = await tooltipGeometry(options);
        return (
          Math.abs(anchor.left - tip.right - 8) +
          Math.abs((tip.top + tip.bottom - anchor.top - anchor.bottom) / 2)
        );
      })
      .toBeLessThan(0.005);
  }
  await visible.evaluate((tip) => {
    tip.style.fontSize = '28px';
  });
  await expect
    .poll(async () => {
      const {anchor, tip} = await tooltipGeometry(options);
      return (
        Math.abs(anchor.left - tip.right - 8) +
        Math.abs((tip.top + tip.bottom - anchor.top - anchor.bottom) / 2)
      );
    })
    .toBeLessThan(0.005);
  const geometry = await tooltipGeometry(options);
  expect(geometry.tip.left).toBeGreaterThanOrEqual(8);
  expect(geometry.tip.right).toBeLessThanOrEqual(712);
  await mkdir(tooltipEvidence, {recursive: true});
  await page.screenshot({path: `${tooltipEvidence}/icon-button-${info.project.name}.png`});
});
test('UI geometry: 8 px wrapped actions, form labels, narrow/zoom equivalent and failed local font', async ({
  page,
}, info) => {
  await page.route('**/*.woff2', (route) => route.abort());
  await page.goto('/tests/design-system/');
  const measurements = [];
  for (const size of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
    {width: 720, height: 450},
  ]) {
    await page.setViewportSize(size);
    const rects = await gaps(page.getByTestId('wrapped-actions'));
    let wrapped = false;
    for (let i = 1; i < rects.length; i++) {
      const previous = rects[i - 1]!,
        current = rects[i]!;
      if (current.top === previous.top) expect(current.left - previous.right).toBeCloseTo(8, 2);
      else {
        wrapped = true;
        expect(current.top - previous.bottom).toBeCloseTo(8, 2);
      }
    }
    expect(wrapped).toBe(true);
    const label = await page
      .getByRole('textbox', {name: 'Projektname', exact: true})
      .evaluate((el) => {
        const field = el.parentElement!,
          label = field.querySelector('label')!,
          style = getComputedStyle(label);
        return {
          gap: el.getBoundingClientRect().top - label.getBoundingClientRect().bottom,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          inputHeight: el.getBoundingClientRect().height,
          background: getComputedStyle(document.body).backgroundColor,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
    expect(label).toMatchObject({
      fontSize: '14px',
      fontWeight: '500',
      background: 'rgb(255, 255, 255)',
    });
    expect(label.gap).toBeCloseTo(8, 2);
    expect(label.inputHeight).toBeGreaterThanOrEqual(40);
    expect(label.scrollWidth).toBeLessThanOrEqual(size.width);
    measurements.push({size, label, rects});
    await capture(page, `components-${info.project.name}-${size.width}-fallback`);
  }
  // WebKit recreates CSS FontFaces after resizing, resetting failed faces to
  // "unloaded". Explicitly load the current faces to verify the actual failure.
  expect(
    await page.evaluate(async () =>
      Promise.all(
        [...document.fonts].map(async (font) => ({
          family: font.family.replaceAll('"', ''),
          weight: font.weight,
          outcome: await font.load().then(
            () => 'loaded',
            () => 'rejected',
          ),
          status: font.status,
        })),
      ),
    ),
  ).toEqual([
    {family: 'Source Sans 3', weight: '200 900', outcome: 'rejected', status: 'error'},
    {family: 'Source Sans 3', weight: '200 900', outcome: 'rejected', status: 'error'},
    {family: 'JetBrains Mono', weight: '400', outcome: 'rejected', status: 'error'},
  ]);
  for (const name of [
    'Source Sans 3 400',
    'Source Sans 3 500',
    'Source Sans 3 600',
    'Source Sans 3 400 italic',
    'JetBrains Mono 400',
  ])
    await expect(page.getByLabel(`Fontstatus ${name}`, {exact: true})).toContainText(
      'Systemfont-Fallback',
    );
  await writeFile(
    `${evidence}/components-${info.project.name}.json`,
    JSON.stringify(measurements, null, 2),
  );
});
test('UI screens: project actions, forms, navigation and settings at target viewports', async ({
  page,
}, info) => {
  await page.goto('/projects');
  await expect(page.getByRole('button', {name: 'Neues Projekt', exact: true})).toHaveClass(
    /dw-button--primary/,
  );
  await expect(page.getByRole('button', {name: 'Projekt öffnen', exact: true})).toHaveClass(
    /dw-button--secondary/,
  );
  await capture(page, `overview-${info.project.name}`);
  await page
    .getByLabel('Name des neuen Projekts')
    .fill('Designsystem – Prüfung mit einem langen Projektnamen');
  await page.getByRole('button', {name: 'Neues Projekt', exact: true}).click();
  for (const size of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(size);
    await expect(page.locator('.sidebar [aria-current="page"]')).toHaveCount(1);
    await page.getByRole('link', {name: 'Übersicht', exact: true}).click();
    const actions = await gaps(page.locator('.archive-actions > .dw-actions > .dw-actions'));
    for (let i = 1; i < actions.length; i++)
      if (actions[i]!.top === actions[i - 1]!.top)
        expect(actions[i]!.left - actions[i - 1]!.right).toBeCloseTo(8, 2);
    await capture(page, `project-${info.project.name}-${size.width}`);
    await page.getByRole('link', {name: 'Daten', exact: true}).click();
    await page.getByRole('button', {name: 'Datei hinzufügen', exact: true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await capture(page, `import-${info.project.name}-${size.width}`);
    await page.keyboard.press('Escape');
  }
  await expect(page.locator('.sidebar svg')).toHaveCount(7);
  await page.getByRole('button', {name: 'Navigation ausklappen'}).click();
  expect((await page.locator('.sidebar').boundingBox())!.width).toBe(212);
  await page.getByRole('link', {name: 'Einstellungen', exact: true}).click();
  for (const size of [
    {width: 1440, height: 900},
    {width: 1280, height: 800},
  ]) {
    await page.setViewportSize(size);
    await capture(page, `settings-${info.project.name}-${size.width}`);
  }
});

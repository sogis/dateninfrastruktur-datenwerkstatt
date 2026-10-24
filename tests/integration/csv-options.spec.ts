import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test, expect} from '../persistentBrowser';
import {isolateOpfs} from '../isolateOpfs';

const variants = [
  {
    name: 'double quotes',
    quote: '"' as const,
    csv: 'id;text;empty;marker\n001;"Basel; Nord";"";NULL\n002;"erste Zeile\nzweite Zeile";;NA\n003;"Er sagte ""Grüezi""";"";"NA"\n',
    rows: [
      ['001', 'Basel; Nord', '', 'NULL'],
      ['002', 'erste Zeile\nzweite Zeile', null, 'NA'],
      ['003', 'Er sagte "Grüezi"', '', 'NA'],
    ],
  },
  {
    name: 'single quotes',
    quote: "'" as const,
    csv: "id;text;empty;marker\n001;'Basel; Nord';'';NULL\n002;'erste Zeile\nzweite Zeile';;NA\n003;'Er sagte ''Grüezi''';'';'NA'\n",
    rows: [
      ['001', 'Basel; Nord', '', 'NULL'],
      ['002', 'erste Zeile\nzweite Zeile', null, 'NA'],
      ['003', "Er sagte 'Grüezi'", '', 'NA'],
    ],
  },
  {
    name: 'no text delimiter',
    quote: '' as const,
    csv: 'id;text;empty;marker\n001;"Basel Nord";"";NULL\n002;\'erste Zeile\';;NA\n003;"Grüezi";"NA";"NA"\n',
    rows: [
      ['001', '"Basel Nord"', '""', 'NULL'],
      ['002', "'erste Zeile'", null, 'NA'],
      ['003', '"Grüezi"', '"NA"', '"NA"'],
    ],
  },
];

for (const variant of variants) {
  for (const customNull of [false, true]) {
    test(`REQ-025 / AT-008: ${variant.name}, ${customNull ? 'explicit NA marker' : 'default NULL handling'} survives full DuckDB import and OPFS reopen`, async ({
      page,
    }) => {
      await page.goto('/tests/spike/index.html');
      const result = await page.evaluate(
        async ({csv, quote, customNull}) => {
          const enginePath = '/src/infrastructure/sqlrooms/fileImportEngine.ts';
          const storePath = '/src/infrastructure/storage/artifactStore.ts';
          const domainPath = '/src/domain/workspace.ts';
          const {DuckDbFileImportEngine, defaultCsvOptions} = (await import(
            enginePath
          )) as typeof import('../../src/infrastructure/sqlrooms/fileImportEngine');
          const {OpfsArtifactStore} = (await import(
            storePath
          )) as typeof import('../../src/infrastructure/storage/artifactStore');
          const {checkedId} = (await import(
            domainPath
          )) as typeof import('../../src/domain/workspace');
          const engine = new DuckDbFileImportEngine(134217728);
          const store = new OpfsArtifactStore(134217728);
          const signal = new AbortController().signal;
          const file = new File([csv], 'quote-options.csv', {type: 'text/csv'});
          let artifact: import('../../src/domain/model').Artifact | undefined;
          try {
            const preview = await engine.preview(
              file,
              'csv',
              {
                ...defaultCsvOptions(),
                quote,
                escape: quote,
                nullStrings: customNull ? ['NA'] : [],
              },
              signal,
            );
            const prepared = await engine.prepare(preview.key, signal);
            artifact = await store.write(
              checkedId<'workspace'>(crypto.randomUUID()),
              prepared.data,
              'application/vnd.apache.parquet',
              signal,
            );
            const hash = await store.verify(artifact, signal);
            await engine.dispose();
            const fresh = new DuckDbFileImportEngine(134217728);
            try {
              const reopened = await fresh.inspect(await store.read(artifact, signal), signal);
              return {
                preview: preview.rows,
                options: preview.csvOptions,
                rowCount: prepared.rowCount,
                reopened: reopened.rows,
                hash,
              };
            } finally {
              await fresh.dispose();
            }
          } finally {
            await engine.dispose();
            if (artifact) await store.delete(artifact);
          }
        },
        {csv: variant.csv, quote: variant.quote, customNull},
      );
      const rows = variant.rows.map((row) => [...row]);
      if (customNull) rows[1]![3] = null;
      expect(result.preview).toEqual(rows);
      expect(result.reopened).toEqual(rows);
      expect(result.rowCount).toBe('3');
      expect(result.hash).toBe('valid');
      expect(result.options).toMatchObject({
        quote: variant.quote,
        escape: variant.quote,
        emptyStringIsNull: true,
        nullStrings: customNull ? ['NA'] : [],
      });
    });
  }
}

test('REQ-025 / AT-008: disabling missing empty fields retains empty text during the full import', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const rows = await page.evaluate(async () => {
    const path = '/src/infrastructure/sqlrooms/fileImportEngine.ts';
    const {DuckDbFileImportEngine, defaultCsvOptions} = (await import(
      path
    )) as typeof import('../../src/infrastructure/sqlrooms/fileImportEngine');
    const engine = new DuckDbFileImportEngine(134217728);
    const signal = new AbortController().signal;
    try {
      const preview = await engine.preview(
        new File(["id;text;marker\n001;;NA\n002;'';'NA'\n"], 'empty-text.csv'),
        'csv',
        {
          ...defaultCsvOptions(),
          quote: "'",
          escape: "'",
          emptyStringIsNull: false,
          nullStrings: ['NA'],
        },
        signal,
      );
      const prepared = await engine.prepare(preview.key, signal);
      return (await engine.inspect(prepared.data, signal)).rows;
    } finally {
      await engine.dispose();
    }
  });
  expect(rows).toEqual([
    ['001', '', null],
    ['002', '', 'NA'],
  ]);
});

test('REQ-025 / AT-008: numeric text and an explicit empty string infer VARCHAR and survive the full import', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const results = await page.evaluate(async () => {
    const path = '/src/infrastructure/sqlrooms/fileImportEngine.ts';
    const {DuckDbFileImportEngine, defaultCsvOptions} = (await import(
      path
    )) as typeof import('../../src/infrastructure/sqlrooms/fileImportEngine');
    const engine = new DuckDbFileImportEngine(134217728);
    const signal = new AbortController().signal;
    const cases = [
      {quote: '"', emptyStringIsNull: true, empty: '""'},
      {quote: "'", emptyStringIsNull: true, empty: "''"},
      {quote: '"', emptyStringIsNull: false, empty: ''},
      {quote: "'", emptyStringIsNull: false, empty: ''},
      {quote: '', emptyStringIsNull: false, empty: ''},
    ] as const;
    const results = [];
    try {
      for (const {quote, emptyStringIsNull, empty} of cases) {
        const preview = await engine.preview(
          new File([`id;value\n001;10\n002;${empty}\n`], 'numeric-with-empty-text.csv'),
          'csv',
          {...defaultCsvOptions(), quote, escape: quote, emptyStringIsNull},
          signal,
        );
        const prepared = await engine.prepare(preview.key, signal);
        const reopened = await engine.inspect(prepared.data, signal);
        results.push({
          quote,
          emptyStringIsNull,
          type: preview.schema.columns[1]?.logicalType,
          nullStrings: preview.csvOptions?.nullStrings,
          preview: preview.rows,
          reopened: reopened.rows,
          rowCount: prepared.rowCount,
        });
        await engine.release(reopened.key);
        await engine.release(preview.key);
      }
      return results;
    } finally {
      await engine.dispose();
    }
  });
  expect(results).toHaveLength(5);
  for (const result of results) {
    expect(result.type, JSON.stringify(result)).toBe('VARCHAR');
    expect(result.nullStrings).toEqual([]);
    expect(result.preview).toEqual([
      ['001', '10'],
      ['002', ''],
    ]);
    expect(result.reopened).toEqual(result.preview);
    expect(result.rowCount).toBe('2');
  }
});

test('REQ-025 / AT-008: disabling empty-field NULL conversion with no marker preserves every literal text value', async ({
  page,
}) => {
  await page.goto('/tests/spike/index.html');
  const result = await page.evaluate(async () => {
    const path = '/src/infrastructure/sqlrooms/fileImportEngine.ts';
    const {DuckDbFileImportEngine, defaultCsvOptions} = (await import(
      path
    )) as typeof import('../../src/infrastructure/sqlrooms/fileImportEngine');
    const engine = new DuckDbFileImportEngine(134217728);
    const signal = new AbortController().signal;
    const values = ['', 'NULL', 'NA', '__NULL__', '\\N', 'null', 'None', 'N/A'];
    try {
      const preview = await engine.preview(
        new File(
          [`id;text\n${values.map((value, index) => `00${index + 1};${value}`).join('\n')}\n`],
          'no-null-markers.csv',
        ),
        'csv',
        {...defaultCsvOptions(), quote: '', escape: '', emptyStringIsNull: false, nullStrings: []},
        signal,
      );
      const prepared = await engine.prepare(preview.key, signal);
      let nulFailure = '';
      try {
        await engine.preview(
          new File(['id;text\n001;embedded\0value\n'], 'nul-input.csv'),
          'csv',
          {
            ...defaultCsvOptions(),
            quote: '',
            escape: '',
            emptyStringIsNull: false,
            nullStrings: [],
          },
          signal,
        );
      } catch (error) {
        nulFailure = String(error);
      }
      return {
        preview: preview.rows,
        reopened: (await engine.inspect(prepared.data, signal)).rows,
        options: preview.csvOptions,
        nulFailure,
      };
    } finally {
      await engine.dispose();
    }
  });
  const rows = ['', 'NULL', 'NA', '__NULL__', '\\N', 'null', 'None', 'N/A'].map((value, index) => [
    `00${index + 1}`,
    value,
  ]);
  expect(result.options).toMatchObject({nullStrings: [], emptyStringIsNull: false});
  expect(result.nulFailure).toContain('CSV enthält Nullbytes');
  expect(result.preview).toEqual(rows);
  expect(result.reopened).toEqual(rows);
});

test('REQ-025 / AT-010 AT-051: all text delimiter options and original bytes survive browser restart and archive export/import', async ({
  playwright,
  browserName,
}) => {
  const folder = await mkdtemp(join(tmpdir(), 'datenwerkstatt-csv-options-'));
  const profile = join(folder, 'profile');
  const storageKey = crypto.randomUUID();
  let context = await playwright[browserName].launchPersistentContext(profile, {headless: true});
  let cleanup = await isolateOpfs(context, storageKey);
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/tests/spike/index.html');
    const before = await page.evaluate(async (variants) => {
      const servicesPath = '/tests/spike/appServices.ts';
      const enginePath = '/src/infrastructure/sqlrooms/fileImportEngine.ts';
      const {initializeServices, services} = (await import(
        servicesPath
      )) as typeof import('../spike/appServices');
      const {defaultCsvOptions} = (await import(
        enginePath
      )) as typeof import('../../src/infrastructure/sqlrooms/fileImportEngine');
      const boot = await initializeServices();
      if (!boot.ready) throw Error(boot.errors.join('\n'));
      const document = await services.workspaces.create('CSV-Optionen nach Neustart');
      const session = await services.workspaces.open(document.workspace.id);
      const signal = new AbortController().signal;
      for (const [index, variant] of variants.entries()) {
        const preview = await session.getDatasets().preview(
          new File([variant.csv], `quelle_${index}.csv`),
          'csv',
          {
            ...defaultCsvOptions(),
            quote: variant.quote,
            escape: variant.quote,
            nullStrings: ['NA'],
          },
          signal,
        );
        await session
          .getDatasets()
          .confirm(
            preview.key,
            {name: variant.name, sqlName: `quelle_${index}`, keepOriginal: true},
            signal,
          );
      }
      await session.flush();
      const origins = Object.values(session.document.datasetVersions).map((v) => v.origin);
      await services.workspaces.close();
      return {workspaceId: document.workspace.id, origins};
    }, variants);
    await context.close();
    context = await playwright[browserName].launchPersistentContext(profile, {headless: true});
    cleanup = await isolateOpfs(context, storageKey);
    const reopened = await context.newPage();
    await reopened.goto('http://127.0.0.1:4173/tests/spike/index.html');
    const after = await reopened.evaluate(async (workspaceId) => {
      const servicesPath = '/tests/spike/appServices.ts';
      const {initializeServices, services} = (await import(
        servicesPath
      )) as typeof import('../spike/appServices');
      const boot = await initializeServices();
      if (!boot.ready) throw Error(boot.errors.join('\n'));
      const session = await services.workspaces.open(workspaceId);
      const signal = new AbortController().signal;
      const origins = Object.values(session.document.datasetVersions).map((v) => v.origin);
      const rows = [];
      for (const dataset of Object.values(session.document.datasets))
        rows.push((await session.getDatasets().inspect(dataset.id, signal)).rows);
      const exported = await session.exportArchive(
        'with-data',
        {keepTemporary: false, includeExternal: false},
        signal,
      );
      const candidate = await services.workspaces.getArchive().inspect(exported.blob, signal);
      const imported = await services.workspaces.importArchive(candidate.id, signal);
      const fresh = await services.workspaces.open(imported.workspace.id);
      const importedRows = [];
      for (const dataset of Object.values(fresh.document.datasets))
        importedRows.push((await fresh.getDatasets().inspect(dataset.id, signal)).rows);
      const importedOptions = Object.values(imported.datasetVersions).map((v) =>
        v.origin.kind === 'file' ? v.origin.csvOptions : undefined,
      );
      const originalTexts = [];
      const storePath = '/src/infrastructure/storage/artifactStore.ts';
      const {OpfsArtifactStore} = (await import(
        storePath
      )) as typeof import('../../src/infrastructure/storage/artifactStore');
      const store = new OpfsArtifactStore(134217728);
      for (const version of Object.values(imported.datasetVersions)) {
        if (version.origin.kind !== 'file' || !version.origin.originalArtifactId)
          throw Error('Original CSV is missing from the imported archive.');
        const artifact = imported.artifacts[version.origin.originalArtifactId];
        if (!artifact) throw Error('Original CSV artifact metadata is missing.');
        originalTexts.push(await new Response(await store.read(artifact, signal)).text());
      }
      await services.workspaces.close();
      return {
        origins,
        rows,
        importedRows,
        importedOptions,
        originalTexts,
        formatVersion: imported.formatVersion,
      };
    }, before.workspaceId);
    expect(after.origins).toEqual(before.origins);
    const expectedRows = variants.map((variant) => {
      const rows = variant.rows.map((row) => [...row]);
      rows[1]![3] = null;
      return rows;
    });
    expect(after.rows).toEqual(expectedRows);
    expect(after.importedRows).toEqual(expectedRows);
    expect(after.importedOptions).toEqual(
      before.origins.map((origin) => (origin.kind === 'file' ? origin.csvOptions : undefined)),
    );
    expect(after.originalTexts).toEqual(variants.map((variant) => variant.csv));
    expect(after.formatVersion).toBe(2);
  } finally {
    try {
      await cleanup();
    } finally {
      await context.close();
      await rm(folder, {recursive: true, force: true});
    }
  }
});

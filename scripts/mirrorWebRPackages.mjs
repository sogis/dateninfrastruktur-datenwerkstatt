import {createHash} from 'node:crypto';
import {readFile, mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const outputRoot = new URL('../public/vendor/webr-packages/', import.meta.url);
const pinned = new URL('./webr-pinned/', import.meta.url);
const basePackages = new Set([
  'R',
  'base',
  'compiler',
  'datasets',
  'grDevices',
  'graphics',
  'grid',
  'methods',
  'parallel',
  'splines',
  'stats',
  'stats4',
  'tcltk',
  'tools',
  'utils',
  'webr',
]);

export async function mirrorWebRPackages(targetRoot = outputRoot) {
  const lock = JSON.parse(await readFile(new URL('./webr-packages.lock.json', import.meta.url)));
  const checksums = JSON.parse(
    await readFile(new URL('./webr-package-checksums.json', import.meta.url)),
  );
  const index = await readFile(new URL('PACKAGES', pinned));
  const records = selectLockedRecords(parsePackageIndex(index.toString('utf8')), lock);
  const compressed = gzipSync(index);
  compressed[9] = 255; // RFC 1952: use the same OS byte on macOS and Linux.
  const assets = new Map([
    [`${lock.targetPath}/PACKAGES`, () => index],
    [`${lock.targetPath}/PACKAGES.gz`, () => compressed],
    [
      'lock.json',
      () =>
        Buffer.from(
          JSON.stringify(
            {
              ...lock,
              packages: records.map((record) => ({name: record.Package, version: record.Version})),
            },
            null,
            2,
          ),
        ),
    ],
  ]);
  for (const record of records) {
    const file = `${record.Package}_${record.Version}.tgz`;
    assets.set(`${lock.targetPath}/${file}`, () =>
      file === 'vroom_1.7.1.9000.tgz'
        ? readFile(new URL(file, pinned))
        : download(`${lock.repoBaseUrl}/${file}`),
    );
  }
  if (
    assets.size !== Object.keys(checksums).length ||
    [...assets.keys()].some((path) => !checksums[path])
  ) {
    throw Error('webR package lock and checksum paths differ');
  }
  const packageDir = new URL(`${lock.targetPath}/`, targetRoot);
  await mkdir(packageDir, {recursive: true});
  const parts = lock.targetPath.split('/');
  const directories = new Set(parts.map((_, i) => parts.slice(0, i + 1).join('/')));
  // R prefers an existing RDS index to PACKAGES.gz. Remove the previous live-index cache.
  await rm(new URL(`${lock.targetPath}/PACKAGES.rds`, targetRoot), {force: true});
  // Vite serves everything under public/, so reject untracked mirror content.
  for (const entry of await readdir(targetRoot, {recursive: true, withFileTypes: true})) {
    const path = relative(fileURLToPath(targetRoot), join(entry.parentPath, entry.name))
      .split(sep)
      .join('/');
    if (entry.isDirectory() && directories.has(path)) continue;
    if (entry.isFile() && assets.has(path)) continue;
    throw Error(`Unexpected webR mirror entry: ${path}`);
  }
  for (const [path, load] of assets) {
    const dest = new URL(path, targetRoot);
    const cached = await readFile(dest).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    const bytes = cached ?? (await load());
    if (createHash('sha256').update(bytes).digest('hex') !== checksums[path]) {
      throw Error(`webR package checksum mismatch: ${path}`);
    }
    if (!cached) {
      await mkdir(new URL('./', dest), {recursive: true});
      await writeFile(dest, bytes);
    }
  }
  console.log('Pinned local R package mirror verified.');
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Could not fetch ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export function parsePackageIndex(text) {
  const records = [];
  let record = null;
  let currentKey = null;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      if (record) {
        records.push(record);
      }
      record = null;
      currentKey = null;
      continue;
    }

    if (/^\s/.test(line) && record && currentKey) {
      record[currentKey] = `${record[currentKey]} ${line.trim()}`;
      continue;
    }

    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    record ??= {__fieldOrder: []};
    currentKey = match[1];
    record[currentKey] = match[2];
    record.__fieldOrder.push(currentKey);
  }

  if (record) {
    records.push(record);
  }
  return records;
}

export function dependencyNames(record) {
  return ['Depends', 'Imports', 'LinkingTo']
    .flatMap((fieldName) => (record[fieldName] ?? '').split(','))
    .map((dependency) => dependency.trim().replace(/\s*\(.+\)$/, ''))
    .filter((dependency) => dependency.length > 0 && !basePackages.has(dependency));
}

export function resolvePackageClosure(packageRecords, rootPackages) {
  const byName = new Map(packageRecords.map((record) => [record.Package, record]));
  const selected = new Set();
  const stack = [...rootPackages];

  while (stack.length > 0) {
    const packageName = stack.pop();
    if (!packageName || selected.has(packageName) || basePackages.has(packageName)) {
      continue;
    }
    const record = byName.get(packageName);
    if (!record) {
      throw new Error(`WebR package ${packageName} is not available in the source index.`);
    }
    selected.add(packageName);
    for (const dependency of dependencyNames(record)) {
      stack.push(dependency);
    }
  }

  return [...selected].sort();
}

export function selectLockedRecords(packageRecords, lock) {
  const byName = new Map(packageRecords.map((record) => [record.Package, record]));
  const lockedPackages = lock.packages?.length
    ? lock.packages.map((entry) => entry.name)
    : resolvePackageClosure(packageRecords, lock.rootPackages ?? []);
  const lockedVersions = new Map((lock.packages ?? []).map((entry) => [entry.name, entry.version]));
  const records = lockedPackages.map((packageName) => {
    const record = byName.get(packageName);
    if (!record) {
      throw new Error(`Locked WebR package ${packageName} is missing from ${lock.repoBaseUrl}.`);
    }
    const expectedVersion = lockedVersions.get(packageName);
    if (expectedVersion && record.Version !== expectedVersion) {
      throw new Error(
        `Locked WebR package ${packageName} expected ${expectedVersion}, found ${record.Version}.`,
      );
    }
    return record;
  });

  const resolved = new Set(resolvePackageClosure(packageRecords, lock.rootPackages ?? []));
  const locked = new Set(lockedPackages);
  for (const dependency of resolved) {
    if (!locked.has(dependency)) {
      throw new Error(`Lock file is missing resolved WebR dependency ${dependency}.`);
    }
  }

  return records.sort((left, right) => left.Package.localeCompare(right.Package));
}

export function formatPackageIndex(records) {
  return `${records
    .map((record) => {
      const keys = record.__fieldOrder?.length
        ? record.__fieldOrder
        : Object.keys(record).filter((key) => !key.startsWith('__'));
      return keys
        .filter((key) => !key.startsWith('__') && record[key] !== undefined)
        .map((key) => `${key}: ${record[key]}`)
        .join('\n');
    })
    .join('\n\n')}\n`;
}

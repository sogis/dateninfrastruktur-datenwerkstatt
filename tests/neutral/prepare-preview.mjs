import {readFile, writeFile} from 'node:fs/promises';

// Operator configuration for the already-built candidate only; no source or rebuild.
const path = new URL('../../dist/runtime-config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
config.appBasePath = '/lab/';
config.buildId = 'neutral-v1.2-asset-smoke';
await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);

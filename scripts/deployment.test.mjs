import {describe, it, expect} from 'vitest';
import {caddyConfig} from './deployment.mjs';

describe('Static navigation allowlist', () => {
  it.each(['/', '/lab/'])(
    'serves project diagnostics under %s without catching missing assets or unknown routes',
    (appBasePath) => {
      const config = caddyConfig({
        appBasePath,
        allowedDataOrigins: [],
        runtimes: {webRChannel: 'post-message'},
      });
      const pattern = config.match(/@navigation path_regexp navigation (\S+)/)?.[1];
      expect(pattern).toBeDefined();
      const matches = new RegExp(pattern);
      for (const path of [
        '/projects/abc/diagnostics',
        '/projects/abc/diagnostics/',
        '/projects/abc/data',
        '/projects/abc/sql/def',
        '/settings',
      ])
        expect(matches.test(path), path).toBe(true);
      for (const path of [
        '/diagnostics',
        '/projects/abc/diagnostics/extra',
        '/projects/abc/other',
        '/projects/abc/diagnostics.js',
        '/assets/missing.js',
        '/vendor/missing.wasm',
        '/workspaces/abc/diagnostics',
      ])
        expect(matches.test(path), path).toBe(false);
      expect(config).toContain(appBasePath === '/' ? '  handle {' : '  handle_path /lab/* {');
    },
  );
});

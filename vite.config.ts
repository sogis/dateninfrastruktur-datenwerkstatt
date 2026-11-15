import {runtimeArchives} from './scripts/runtime-archives';
import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: process.env.APP_BASE_PATH ?? '/',
  plugins: [runtimeArchives(), react()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    ...(process.env.DW_PLAYWRIGHT === '1' ? {watch: null} : {}),
  },
  preview: {host: '127.0.0.1', port: 4173, strictPort: true},
  // Worker and browser-only test imports are discovered too late by the initial scan.
  optimizeDeps: {include: ['exceljs', 'fflate']},
  build: {license: {fileName: 'licenses/npm-bundle.json'}, manifest: true},
  test: {
    server: {deps: {inline: [/@sqlrooms\//]}},
    include: ['tests/unit/**/*.test.ts', 'scripts/*.test.mjs'],
  },
});

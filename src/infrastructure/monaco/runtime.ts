import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
globalThis.MonacoEnvironment = {getWorker: () => new EditorWorker()};
export {monaco};

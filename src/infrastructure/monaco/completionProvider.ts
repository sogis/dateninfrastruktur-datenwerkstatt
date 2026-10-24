import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import {SqlCompletionContexts, type SqlCompletionTable} from './sqlCompletion';

const contexts = new SqlCompletionContexts();
let registered = false;
export function bindSqlCompletions(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  getTables: () => readonly SqlCompletionTable[],
) {
  if (!registered) {
    registered = true;
    monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.', ',', '(', '='],
      provideCompletionItems(currentModel, position) {
        const line = currentModel.getLineContent(position.lineNumber);
        const {replaceLength, items} = contexts.suggestions(
          currentModel,
          line.slice(0, position.column - 1),
        );
        const quoted = line[position.column - replaceLength - 1] === '"';
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - replaceLength,
          // Monaco may already have inserted the matching closing quote.
          endColumn: position.column + (quoted && line[position.column - 1] === '"' ? 1 : 0),
        };
        return {
          suggestions: items.map((item) => ({
            ...item,
            filterText: quoted ? `"${item.label}` : item.label,
            kind: monaco.languages.CompletionItemKind[
              item.kind === 'keyword' ? 'Keyword' : item.kind === 'table' ? 'Class' : 'Field'
            ],
            range,
          })),
        };
      },
    });
  }
  return contexts.bind(model, getTables);
}

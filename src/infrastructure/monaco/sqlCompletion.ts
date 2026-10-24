import {duckdbKeywords} from './duckdbKeywords';

export interface SqlCompletionTable {
  name: string;
  columns: readonly {name: string; type: string}[];
}
export interface SqlSuggestion {
  label: string;
  insertText: string;
  kind: 'keyword' | 'table' | 'column';
  detail: string;
  sortText: string;
}
const keywords = [...new Set(duckdbKeywords)];
const reserved = new Set(keywords.map((keyword) => keyword.toLowerCase()));
function identifier(name: string) {
  return /^[a-z_][a-z0-9_]*$/i.test(name) && !reserved.has(name.toLowerCase())
    ? name
    : `"${name.replaceAll('"', '""')}"`;
}

/** Completion context only; this neither parses nor executes the SQL statement. */
export function sqlSuggestions(beforeCursor: string, tables: readonly SqlCompletionTable[]) {
  const fragment =
    beforeCursor.match(/(?:^|[\s.,(])("(?:[^"\n]|"")*)$/)?.[1] ??
    beforeCursor.match(/[\w$]+$/)?.[0] ??
    '';
  const beforeFragment = beforeCursor.slice(0, beforeCursor.length - fragment.length);
  // Datasets live in the fixed data schema. Only known table names form column contexts.
  const qualified = beforeFragment.match(
    /(?:^|[^\w.])(?:data\.)?(?:"((?:[^"]|"")*)"|([a-z_][a-z0-9_]*))\.$/i,
  );
  const qualifier = qualified ? (qualified[1] ?? qualified[2]!).replaceAll('""', '"') : '';
  const table = qualified
    ? tables.find((item) => item.name.toLowerCase() === qualifier.toLowerCase())
    : undefined;
  const schemaContext = /\bdata\.$/i.test(beforeFragment);
  const tableContext =
    schemaContext || /\b(?:from|join|into|update|table)\s+$/i.test(beforeFragment);
  const items: SqlSuggestion[] = [];
  if (table && !schemaContext) {
    for (const column of table.columns)
      items.push({
        label: column.name,
        insertText: identifier(column.name),
        kind: 'column',
        detail: `${column.type} · data.${table.name}`,
        sortText: `a${column.name}`,
      });
  } else if (beforeFragment.endsWith('.') && !schemaContext) {
    // Unknown qualifiers (including aliases) are not guessed from SQL text.
    return {replaceLength: fragment.length, items};
  } else {
    if (!schemaContext)
      for (const keyword of keywords)
        items.push({
          label: keyword,
          insertText: keyword,
          kind: 'keyword',
          detail: 'SQL-Schlüsselwort',
          sortText: `${tableContext ? 'z' : 'a'}${keyword}`,
        });
    for (const current of tables) {
      const name = `data.${identifier(current.name)}`;
      items.push({
        label: schemaContext ? current.name : `data.${current.name}`,
        insertText: schemaContext ? identifier(current.name) : name,
        kind: 'table',
        detail: 'Tabelle',
        sortText: `${tableContext ? 'a' : 'c'}${current.name}`,
      });
      if (tableContext) continue;
      for (const column of current.columns) {
        const detail = `${column.type} · data.${current.name}`;
        items.push({
          label: column.name,
          insertText: identifier(column.name),
          kind: 'column',
          detail,
          sortText: `d${column.name}`,
        });
        items.push({
          label: `data.${current.name}.${column.name}`,
          insertText: `${name}.${identifier(column.name)}`,
          kind: 'column',
          detail,
          sortText: `e${current.name}.${column.name}`,
        });
      }
    }
  }
  return {replaceLength: fragment.length, items};
}

/** Context belongs to the mounted editor model, never to the global SQL language. */
export class SqlCompletionContexts {
  private readonly contexts = new WeakMap<object, () => readonly SqlCompletionTable[]>();
  bind(model: object, getTables: () => readonly SqlCompletionTable[]) {
    this.contexts.set(model, getTables);
    return () => {
      if (this.contexts.get(model) === getTables) this.contexts.delete(model);
    };
  }
  suggestions(model: object, beforeCursor: string) {
    const getTables = this.contexts.get(model);
    return getTables ? sqlSuggestions(beforeCursor, getTables()) : {replaceLength: 0, items: []};
  }
}

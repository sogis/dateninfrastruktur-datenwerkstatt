import {describe, expect, it} from 'vitest';
import {
  SqlCompletionContexts,
  sqlSuggestions,
  type SqlCompletionTable,
} from '../../src/infrastructure/monaco/sqlCompletion';

const tables: readonly SqlCompletionTable[] = [
  {
    name: 'zahlen',
    columns: [
      {name: 'wert', type: 'INTEGER'},
      {name: 'mit "Zitat"', type: 'VARCHAR'},
    ],
  },
  {name: 'orte', columns: [{name: 'ort', type: 'VARCHAR'}]},
];
describe('SQL completion using current project schemas', () => {
  it('offers SQL keywords and prioritizes the fixed data namespace after FROM or JOIN', () => {
    expect(sqlSuggestions('SEL', tables).items).toContainEqual(
      expect.objectContaining({label: 'SELECT', insertText: 'SELECT', kind: 'keyword'}),
    );
    const result = sqlSuggestions('SELECT * FROM zah', tables);
    expect(result.replaceLength).toBe(3);
    expect(result.items).toContainEqual(
      expect.objectContaining({
        label: 'data.zahlen',
        insertText: 'data.zahlen',
        sortText: 'azahlen',
      }),
    );
    expect(result.items.filter((item) => item.kind === 'column')).toEqual([]);
    expect(sqlSuggestions('JOIN data.z', tables).items).toEqual([
      expect.objectContaining({label: 'zahlen', insertText: 'zahlen'}),
      expect.objectContaining({label: 'orte', insertText: 'orte'}),
    ]);
  });
  it('offers only the qualified table columns and quotes arbitrary column names', () => {
    const result = sqlSuggestions('SELECT data.ZAHLEN.we', tables);
    expect(result.replaceLength).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items).toContainEqual(
      expect.objectContaining({label: 'wert', detail: 'INTEGER · data.zahlen'}),
    );
    expect(result.items).toContainEqual(
      expect.objectContaining({label: 'mit "Zitat"', insertText: '"mit ""Zitat"""'}),
    );
    const quoted = sqlSuggestions('SELECT data.zahlen."mit', tables);
    expect(quoted.replaceLength).toBe(4);
    expect(sqlSuggestions('SELECT unbekannt.', tables).items).toEqual([]);
    expect(sqlSuggestions('SELECT anderes_schema.zahlen.', tables).items).toEqual([]);
  });
  it('offers unqualified and fully qualified columns without trusting metadata as markup', () => {
    const result = sqlSuggestions('SELECT ', tables);
    expect(result.items).toContainEqual(
      expect.objectContaining({label: 'wert', insertText: 'wert'}),
    );
    expect(result.items).toContainEqual(
      expect.objectContaining({
        label: 'data.zahlen.mit "Zitat"',
        insertText: 'data.zahlen."mit ""Zitat"""',
      }),
    );
    expect(
      sqlSuggestions('SELECT data."select".', [
        {name: 'select', columns: [{name: 'from', type: 'VARCHAR'}]},
      ]).items,
    ).toEqual([expect.objectContaining({insertText: '"from"'})]);
  });
  it('isolates models and uses current schemas, then removes context on disposal', () => {
    const contexts = new SqlCompletionContexts();
    const model = {};
    const other = {};
    let current = tables;
    const dispose = contexts.bind(model, () => current);
    contexts.bind(other, () => [{name: 'anderes_projekt', columns: []}]);
    expect(contexts.suggestions(model, 'FROM data.').items.map((item) => item.label)).toEqual([
      'zahlen',
      'orte',
    ]);
    expect(contexts.suggestions(other, 'FROM data.').items.map((item) => item.label)).toEqual([
      'anderes_projekt',
    ]);
    current = [tables[1]!];
    expect(contexts.suggestions(model, 'FROM data.').items.map((item) => item.label)).toEqual([
      'orte',
    ]);
    dispose();
    expect(contexts.suggestions(model, 'FROM data.').items).toEqual([]);
  });
});

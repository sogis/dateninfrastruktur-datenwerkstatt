import {describe, expect, it} from 'vitest';
import recipe from '../../fixtures/workspace.recipe.json';
import {csvImportOptionsSchema} from '../../src/domain/importOptions';
import {parseWorkspace} from '../../src/domain/workspace';

function recipeWithCharacters(quote: string, escape = quote) {
  const document = structuredClone(recipe);
  const options = Object.values(document.datasetVersions)[0]!.origin.csvOptions;
  options.quote = quote;
  options.escape = escape;
  return {document, options};
}

describe('CSV text delimiter boundaries', () => {
  it.each(['"', "'", ''] as const)(
    'accepts %j for import and preserves it in the version 1 document',
    (quote) => {
      const {document, options} = recipeWithCharacters(quote);
      expect(csvImportOptionsSchema.parse(options)).toEqual(options);
      const parsed = parseWorkspace(document);
      expect(parsed.formatVersion).toBe(1);
      expect(Object.values(parsed.datasetVersions)[0]!.origin).toEqual(
        Object.values(document.datasetVersions)[0]!.origin,
      );
    },
  );

  it.each(['quote', 'escape'] as const)(
    'rejects unsupported %s at both JSON boundaries',
    (field) => {
      for (const value of ['|', '""', '\n', "'; SELECT 1; --"]) {
        const {document, options} = recipeWithCharacters('"');
        options[field] = value;
        expect(csvImportOptionsSchema.safeParse(options).success).toBe(false);
        expect(() => parseWorkspace(document)).toThrow(
          expect.objectContaining({code: 'VALIDATION_FAILED'}),
        );
      }
    },
  );
});

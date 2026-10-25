/** Alignment follows the logical type; numeric-looking identifiers remain text. */
export function numericColumn(logicalType: string | undefined): boolean {
  return /^(?:U?(?:TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT)|FLOAT|DOUBLE|REAL|DECIMAL(?:\(\d+,\s*\d+\))?)$/.test(
    logicalType ?? '',
  );
}

export function schemaTypeCategory(logicalType: string): 'numeric' | 'text' | 'boolean' | 'other' {
  const type = logicalType.trim().toUpperCase();
  if (numericColumn(type)) return 'numeric';
  if (/^(?:VARCHAR|CHAR|BPCHAR|TEXT|STRING)(?:\(\d+\))?$/.test(type)) return 'text';
  if (/^(?:BOOLEAN|BOOL)$/.test(type)) return 'boolean';
  return 'other';
}

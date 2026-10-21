import {z} from 'zod';

export const csvImportOptionsSchema = z
  .strictObject({
    encoding: z.literal('utf-8'),
    delimiter: z.enum([',', ';', '\t', '|']),
    header: z.boolean(),
    quote: z.literal('"'),
    escape: z.literal('"'),
    decimalSeparator: z.enum(['.', ',']),
    nullStrings: z.array(z.string()),
    emptyStringIsNull: z.boolean(),
    columns: z.array(
      z.strictObject({
        sourceIndex: z.number().int().nonnegative(),
        name: z.string().min(1),
        logicalType: z
          .string()
          .regex(
            /^(VARCHAR|BOOLEAN|TINYINT|SMALLINT|INTEGER|BIGINT|UBIGINT|HUGEINT|DOUBLE|FLOAT|DATE|TIMESTAMP|TIMESTAMPTZ|DECIMAL\((?:[1-9]|[12][0-9]|3[0-8]),(?:[0-9]|[12][0-9]|3[0-8])\))$/,
          ),
      }),
    ),
  })
  .refine(
    (o) => new Set(o.columns.map((c) => c.name)).size === o.columns.length,
    'Doppelte Spaltennamen.',
  )
  .refine(
    (o) => o.columns.every((c, i) => c.sourceIndex === i),
    'Die Quellspalten dürfen nicht still umgeordnet werden.',
  );

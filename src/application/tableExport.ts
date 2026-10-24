/** Download formats only; workspace storage and import formats remain unchanged. */
export type TableExportFormat = 'csv' | 'parquet' | 'xlsx';

export function tableExportMediaType(format: TableExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'parquet':
      return 'application/vnd.apache.parquet';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
}

export const XLSX_EXPORT_NOTE =
  'XLSX: DECIMAL, Datum/Zeit und numerische Spalten ausserhalb der exakten Excel-Darstellung werden als Text exportiert. Zeitwerte mit Zeitzone verwenden UTC; NULL bleibt von leerem Text unterscheidbar.';

import {bindingNameSchema, nameSchema, sqlNameSchema} from './workspace';
import {csvImportOptionsSchema} from './importOptions';

export function requiredValueError(value: string, message = 'Bitte wähle einen Wert aus.') {
  return value ? undefined : message;
}

export function displayNameError(value: string, noun = 'Namen') {
  if (nameSchema.safeParse(value).success) return;
  if (!value.trim()) return `Bitte gib einen ${noun} ein.`;
  if (value.trim().length > 120) return 'Der Name darf höchstens 120 Zeichen enthalten.';
  return 'Der Name darf keine Steuerzeichen enthalten.';
}

export function sqlNameError(value: string, occupied: readonly string[] = []) {
  if (!value) return 'Bitte gib einen SQL-Namen ein.';
  if (!sqlNameSchema.safeParse(value).success)
    return value.startsWith('__dw_')
      ? 'Das Präfix __dw_ ist reserviert. Bitte wähle einen anderen SQL-Namen.'
      : 'Verwende höchstens 63 Zeichen: kleine Buchstaben, Ziffern und Unterstriche; beginne mit einem Buchstaben oder Unterstrich.';
  if (occupied.includes(value)) return 'Dieser SQL-Name ist bereits reserviert.';
}

export function bindingNameError(value: string) {
  if (!value) return 'Bitte gib einen R-Variablennamen ein.';
  if (!bindingNameSchema.safeParse(value).success)
    return 'Verwende einen gültigen R-Variablennamen (Buchstabe, danach Buchstaben, Ziffern oder Unterstriche; höchstens 64 Zeichen). Reservierte Wörter, params und das Präfix lab_ sind nicht erlaubt.';
}

export function csvColumnNameError(value: string, otherNames: readonly string[]) {
  if (!csvImportOptionsSchema.shape.columns.element.shape.name.safeParse(value).success)
    return 'Bitte gib einen Spaltennamen ein.';
  if (otherNames.includes(value)) return 'Dieser Spaltenname wird bereits verwendet.';
}

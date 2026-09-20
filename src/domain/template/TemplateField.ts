export interface TemplateField {
  /** Stable identity for this slot within a template. */
  readonly id: string;
  /** Built-in field definition used by this template slot. */
  readonly fieldId: string;
  /** Optional user-facing label for this template slot. */
  readonly label?: string;
  /** Optional unit override; null means use the field's default unit. */
  readonly unit?: string | null;
}

export function createTemplateField(
  fieldId: string,
  unit?: string | null,
  label?: string,
): TemplateField {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fieldId,
    ...(label?.trim() ? { label: label.trim() } : {}),
    ...(unit !== undefined ? { unit } : {}),
  };
}

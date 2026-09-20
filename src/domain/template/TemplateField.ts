export interface TemplateField {
  /** Stable identity for this slot within a template. */
  readonly id: string;
  /** Built-in field definition used by this template slot. */
  readonly fieldId: string;
  /** Optional unit override; null means use the field's default unit. */
  readonly unit?: string | null;
}

export function createTemplateField(
  fieldId: string,
  unit?: string | null,
): TemplateField {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fieldId,
    ...(unit !== undefined ? { unit } : {}),
  };
}

import type { FieldValueType } from "./FieldValueType";

export interface FieldValue {
  fieldId: string;
  /** Template slot that produced this value, when applicable. */
  templateFieldId?: string;
  /** Scene observation slot that produced this value, when applicable. */
  sceneFieldId?: string;
  valueType: FieldValueType;
  /** Numeric value; duration fields store milliseconds. */
  value: number;
  /** Unit used for this recorded value. Omitted for legacy values. */
  unit?: string | null;
}

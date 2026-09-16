import type { FieldValueType } from "./FieldValueType";

export interface FieldValue {
  fieldId: string;
  valueType: FieldValueType;
  /** Number fields store their numeric value; duration fields store milliseconds. */
  value: number;
}

import type { FieldValueType } from "./FieldValueType";

export interface Field {
  readonly id: string;
  readonly name: string;
  /** Display unit for numeric fields; null when the field is self-describing. */
  readonly unit: string | null;
  readonly valueType: FieldValueType;
}

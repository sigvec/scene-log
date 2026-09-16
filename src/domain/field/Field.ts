import type { FieldValueType } from "./FieldValueType";

export interface Field {
  readonly id: string;
  readonly name: string;
  readonly valueType: FieldValueType;
}

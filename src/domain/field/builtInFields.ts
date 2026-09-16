import type { Field } from "./Field";

export const BUILT_IN_FIELDS = {
  value: {
    id: "value",
    name: "Value",
    valueType: "number",
  },
  elapsedTime: {
    id: "elapsed-time",
    name: "Elapsed Time",
    valueType: "duration",
  },
} satisfies Record<string, Field>;

export const FIELD_LIST = Object.values(BUILT_IN_FIELDS);

export function getFieldById(fieldId: string): Field {
  return FIELD_LIST.find((field) => field.id === fieldId) ?? BUILT_IN_FIELDS.value;
}

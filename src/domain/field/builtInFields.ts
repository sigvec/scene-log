import type { Field } from "./Field";

export const BUILT_IN_FIELDS = {
  voltage: {
    id: "voltage",
    name: "Voltage",
    unit: "V",
    valueType: "number",
  },
  current: {
    id: "current",
    name: "Current",
    unit: "A",
    valueType: "number",
  },
  frequency: {
    id: "frequency",
    name: "Frequency",
    unit: "Hz",
    valueType: "number",
  },
  temperature: {
    id: "temperature",
    name: "Temperature",
    unit: "°C",
    valueType: "number",
  },
  elapsedTime: {
    id: "elapsed-time",
    name: "Elapsed Time",
    unit: null,
    valueType: "duration",
  },
  value: {
    id: "value",
    name: "Value",
    unit: null,
    valueType: "number",
  },
} satisfies Record<string, Field>;

export const FIELD_LIST: Field[] = [
  BUILT_IN_FIELDS.value,
  BUILT_IN_FIELDS.voltage,
  BUILT_IN_FIELDS.current,
  BUILT_IN_FIELDS.frequency,
  BUILT_IN_FIELDS.temperature,
  BUILT_IN_FIELDS.elapsedTime,
];

export function getFieldById(fieldId: string): Field {
  return (
    FIELD_LIST.find((field) => field.id === fieldId) ?? BUILT_IN_FIELDS.value
  );
}

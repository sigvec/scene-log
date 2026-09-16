import type { FieldValue } from "../field/FieldValue";
import type { Capture } from "./Capture";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createCapture(
  fieldValues: FieldValue[],
  sourceImageUri?: string,
): Capture {
  return {
    id: generateId(),
    createdAt: new Date(),
    ...(sourceImageUri ? { sourceImageUri } : {}),
    fieldValues,
  };
}

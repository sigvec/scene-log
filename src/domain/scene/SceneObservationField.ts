import { getFieldById } from "../field/builtInFields";

export interface SceneObservationField {
  readonly id: string;
  readonly fieldId: string;
  readonly label?: string;
  readonly unit?: string | null;
}

export function createSceneObservationField(
  fieldId: string,
  unit?: string | null,
  label?: string,
): SceneObservationField {
  const field = getFieldById(fieldId);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fieldId: field.id,
    ...(label?.trim() ? { label: label.trim() } : {}),
    ...(unit !== undefined ? { unit } : {}),
  };
}

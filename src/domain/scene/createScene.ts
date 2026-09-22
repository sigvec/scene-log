import type { Scene } from "./Scene";
import type { SceneObservationField } from "./SceneObservationField";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createScene(
  projectId: string,
  name: string,
  description?: string,
  observationFields: SceneObservationField[] = [],
): Scene {
  const now = new Date();

  return {
    id: generateId(),
    projectId,
    name: name.trim(),
    ...(description?.trim() ? { description: description.trim() } : {}),
    observationFields,
    createdAt: now,
    updatedAt: now,
  };
}

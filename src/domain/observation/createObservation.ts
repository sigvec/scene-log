import type { Observation } from "./Observation";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createObservation(sceneId?: string): Observation {
  return {
    id: generateId(),
    ...(sceneId ? { sceneId } : {}),
    createdAt: new Date(),
    captures: [],
  };
}

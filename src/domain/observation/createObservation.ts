import type { Observation } from "./Observation";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createObservation(): Observation {
  return {
    id: generateId(),
    createdAt: new Date(),
    captures: [],
  };
}

import type { Observation } from "./Observation";

export function createObservation(): Observation {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
}

import type { Observation } from "./Observation";
import type { ObservationData } from "./ObservationData";

export function deserializeObservation(data: ObservationData): Observation {
  return {
    id: data.id,
    createdAt: new Date(data.createdAt),
    imageUri: data.imageUri,
    captures: data.captures.map((capture) => ({
      id: capture.id,
      createdAt: new Date(capture.createdAt),
      fieldValues: capture.fieldValues,
    })),
  };
}

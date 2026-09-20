import type { Observation } from "./Observation";
import type { ObservationData } from "./ObservationData";

export function serializeObservation(
  observation: Observation,
): ObservationData {
  return {
    id: observation.id,
    createdAt: observation.createdAt.toISOString(),
    captures: observation.captures.map((capture) => ({
      id: capture.id,
      createdAt: capture.createdAt.toISOString(),
      ...(capture.templateId ? { templateId: capture.templateId } : {}),
      ...(capture.sourceImageUri
        ? { sourceImageUri: capture.sourceImageUri }
        : {}),
      fieldValues: capture.fieldValues,
    })),
  };
}

import type { Observation } from "./Observation";
import type { ObservationData } from "./ObservationData";

export function deserializeObservation(data: ObservationData): Observation {
  const captures = data.captures.map((capture) => ({
    id: capture.id,
    createdAt: new Date(capture.createdAt),
    sourceImageUri: capture.sourceImageUri,
    fieldValues: capture.fieldValues,
  }));

  // Migrate the previous observation-level image to capture-level provenance.
  // If there are no captures, preserve the image by creating an empty capture.
  if (data.imageUri && captures.length === 0) {
    captures.push({
      id: `legacy-image-${data.id}`,
      createdAt: new Date(data.createdAt),
      sourceImageUri: data.imageUri,
      fieldValues: [],
    });
  } else if (data.imageUri) {
    for (const capture of captures) {
      if (!capture.sourceImageUri) {
        capture.sourceImageUri = data.imageUri;
      }
    }
  }

  return {
    id: data.id,
    createdAt: new Date(data.createdAt),
    captures,
  };
}

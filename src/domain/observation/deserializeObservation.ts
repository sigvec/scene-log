import { BUILT_IN_FIELDS, getFieldById } from "../field/builtInFields";
import type { Observation } from "./Observation";
import type { ObservationData } from "./ObservationData";

export function deserializeObservation(data: ObservationData): Observation {
  const captures = data.captures.map((capture) => ({
    id: capture.id,
    createdAt: new Date(capture.createdAt),
    ...(capture.templateId ? { templateId: capture.templateId } : {}),
    sourceImageUri: capture.sourceImageUri,
    fieldValues: capture.fieldValues.map((fieldValue) => ({
      ...fieldValue,
      // v0.2 values did not persist a type. Preserve them as numeric Values.
      valueType:
        fieldValue.valueType ??
        getFieldById(fieldValue.fieldId).valueType ??
        BUILT_IN_FIELDS.value.valueType,
    })),
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
    ...(data.sceneId ? { sceneId: data.sceneId } : {}),
    createdAt: new Date(data.createdAt),
    captures,
  };
}

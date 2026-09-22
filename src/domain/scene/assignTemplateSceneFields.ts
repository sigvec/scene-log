import type { Template } from "../template/Template";
import type { SceneObservationField } from "./SceneObservationField";

/**
 * Suggests Scene expected-value assignments for a template when the template
 * is used within a specific Scene. Ambiguous fields remain unassigned.
 */
export function assignTemplateSceneFields(
  template: Template,
  sceneFields: SceneObservationField[],
): Record<string, string | null> {
  const assignments: Record<string, string | null> = {};

  for (const templateField of template.fields) {
    const candidates = sceneFields.filter(
      (sceneField) => sceneField.fieldId === templateField.fieldId,
    );
    const templateLabel = templateField.label?.trim().toLowerCase();

    if (templateLabel) {
      const labelMatch = candidates.find(
        (sceneField) => sceneField.label?.trim().toLowerCase() === templateLabel,
      );
      if (labelMatch) {
        assignments[templateField.id] = labelMatch.id;
        continue;
      }
    }

    assignments[templateField.id] = candidates.length === 1 ? candidates[0].id : null;
  }

  return assignments;
}

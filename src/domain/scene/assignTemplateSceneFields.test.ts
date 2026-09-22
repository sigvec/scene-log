import { createTemplate } from "../template/createTemplate";
import { createTemplateField } from "../template/TemplateField";
import { assignTemplateSceneFields } from "./assignTemplateSceneFields";
import type { SceneObservationField } from "./SceneObservationField";

function sceneField(
  id: string,
  fieldId: string,
  label?: string,
): SceneObservationField {
  return { id, fieldId, ...(label ? { label } : {}) };
}

describe("assignTemplateSceneFields", () => {
  it("automatically assigns a unique compatible scene field", () => {
    const templateField = createTemplateField("voltage");
    const template = createTemplate("Electrical", [templateField]);
    const expected = sceneField("input-voltage", "voltage", "Input Voltage");

    expect(assignTemplateSceneFields(template, [expected])).toEqual({
      [templateField.id]: expected.id,
    });
  });

  it("uses matching labels when multiple compatible fields exist", () => {
    const templateField = createTemplateField("voltage", undefined, "Output Voltage");
    const template = createTemplate("Electrical", [templateField]);
    const input = sceneField("input", "voltage", "Input Voltage");
    const output = sceneField("output", "voltage", "Output Voltage");

    expect(assignTemplateSceneFields(template, [input, output])).toEqual({
      [templateField.id]: output.id,
    });
  });

  it("leaves ambiguous fields unassigned", () => {
    const templateField = createTemplateField("voltage");
    const template = createTemplate("Electrical", [templateField]);
    const input = sceneField("input", "voltage", "Input Voltage");
    const output = sceneField("output", "voltage", "Output Voltage");

    expect(assignTemplateSceneFields(template, [input, output])).toEqual({
      [templateField.id]: null,
    });
  });

  it("does not assign incompatible field types", () => {
    const templateField = createTemplateField("voltage");
    const template = createTemplate("Electrical", [templateField]);
    const temperature = sceneField("temperature", "temperature", "Temperature");

    expect(assignTemplateSceneFields(template, [temperature])).toEqual({
      [templateField.id]: null,
    });
  });
});

import { createTemplate } from "./createTemplate";
import { deserializeTemplate } from "./deserializeTemplate";
import { serializeTemplate } from "./serializeTemplate";
import type { TemplateField } from "./TemplateField";

function templateField(id: string, fieldId: string, unit?: string, label?: string): TemplateField {
  return { id, fieldId, ...(label ? { label } : {}), ...(unit ? { unit } : {}) };
}

describe("Template", () => {
  it("creates a template with ordered field slots", () => {
    const fields = [
      templateField("voltage-sample", "voltage", "V", "Sample voltage"),
      templateField("voltage-detector", "voltage", "mV", "Detector voltage"),
      templateField("current", "current", "mA"),
    ];

    const template = createTemplate("Electrical Test", fields);

    expect(template.name).toBe("Electrical Test");
    expect(template.fields).toEqual(fields);
    expect(template.createdAt).toBeInstanceOf(Date);
    expect(template.updatedAt).toBeInstanceOf(Date);
  });

  it("allows the same field type to appear more than once", () => {
    const template = createTemplate("Two Voltmeters", [
      templateField("left-voltage", "voltage", "V"),
      templateField("right-voltage", "voltage", "V"),
    ]);

    expect(template.fields).toHaveLength(2);
    expect(template.fields[0].fieldId).toBe("voltage");
    expect(template.fields[1].fieldId).toBe("voltage");
    expect(template.fields[0].id).not.toBe(template.fields[1].id);
  });

  it("round-trips field slots, labels, and unit overrides through serialization", () => {
    const template = createTemplate("Electrical Test", [
      templateField("sample-voltage", "voltage", "V", "Sample voltage"),
      templateField("detector-voltage", "voltage", "mV", "Detector voltage"),
    ]);

    const restored = deserializeTemplate(serializeTemplate(template));

    expect(restored).toEqual(template);
    expect(restored.fields[0].label).toBe("Sample voltage");
    expect(restored.fields[1].label).toBe("Detector voltage");
  });

  it("migrates legacy fieldIds templates", () => {
    const restored = deserializeTemplate({
      id: "legacy-template",
      name: "Legacy",
      fieldIds: ["voltage", "current", "voltage"],
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    });

    expect(restored.fields).toHaveLength(3);
    expect(restored.fields.map((field) => field.fieldId)).toEqual([
      "voltage",
      "current",
      "voltage",
    ]);
    expect(new Set(restored.fields.map((field) => field.id)).size).toBe(3);
  });
});

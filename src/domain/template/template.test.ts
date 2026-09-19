import { createTemplate } from "./createTemplate";
import { deserializeTemplate } from "./deserializeTemplate";
import { serializeTemplate } from "./serializeTemplate";

describe("Template", () => {
  it("creates a template with its fields", () => {
    const template = createTemplate("Electrical Test", [
      "voltage",
      "current",
      "frequency",
    ]);

    expect(template.name).toBe("Electrical Test");
    expect(template.fieldIds).toEqual(["voltage", "current", "frequency"]);
    expect(template.createdAt).toBeInstanceOf(Date);
    expect(template.updatedAt).toBeInstanceOf(Date);
  });

  it("round-trips through serialization", () => {
    const template = createTemplate("Electrical Test", ["voltage", "current"]);

    const restored = deserializeTemplate(serializeTemplate(template));

    expect(restored).toEqual(template);
  });
});

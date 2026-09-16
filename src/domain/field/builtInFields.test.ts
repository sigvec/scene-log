import { BUILT_IN_FIELDS } from "./builtInFields";

describe("BUILT_IN_FIELDS", () => {
  it("defines the built-in Value field", () => {
    expect(BUILT_IN_FIELDS.value).toEqual({
      id: "value",
      name: "Value",
    });
  });
});

import { BUILT_IN_FIELDS, FIELD_LIST, getFieldById } from "./builtInFields";

describe("BUILT_IN_FIELDS", () => {
  it("defines the built-in Value field", () => {
    expect(BUILT_IN_FIELDS.value).toEqual({
      id: "value",
      name: "Value",
      valueType: "number",
    });
  });

  it("defines the built-in Elapsed Time field", () => {
    expect(BUILT_IN_FIELDS.elapsedTime).toEqual({
      id: "elapsed-time",
      name: "Elapsed Time",
      valueType: "duration",
    });
  });

  it("returns the built-in field by id", () => {
    expect(getFieldById("elapsed-time")).toBe(BUILT_IN_FIELDS.elapsedTime);
    expect(getFieldById("missing")).toBe(BUILT_IN_FIELDS.value);
    expect(FIELD_LIST).toHaveLength(2);
  });
});

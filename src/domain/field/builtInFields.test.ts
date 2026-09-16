import { BUILT_IN_FIELDS, FIELD_LIST, getFieldById } from "./builtInFields";

describe("BUILT_IN_FIELDS", () => {
  it("defines the built-in Value field", () => {
    expect(BUILT_IN_FIELDS.value).toEqual({
      id: "value",
      name: "Value",
      unit: null,
      valueType: "number",
    });
  });

  it("defines the built-in Elapsed Time field", () => {
    expect(BUILT_IN_FIELDS.elapsedTime).toEqual({
      id: "elapsed-time",
      name: "Elapsed Time",
      unit: null,
      valueType: "duration",
    });
  });

  it("defines physical units for measurement fields", () => {
    expect(BUILT_IN_FIELDS.voltage.unit).toBe("V");
    expect(BUILT_IN_FIELDS.current.unit).toBe("A");
    expect(BUILT_IN_FIELDS.frequency.unit).toBe("Hz");
    expect(BUILT_IN_FIELDS.temperature.unit).toBe("°C");
  });

  it("returns the built-in field by id", () => {
    expect(getFieldById("value")).toBe(BUILT_IN_FIELDS.value);
    expect(getFieldById("voltage")).toBe(BUILT_IN_FIELDS.voltage);
    expect(getFieldById("current")).toBe(BUILT_IN_FIELDS.current);
    expect(getFieldById("frequency")).toBe(BUILT_IN_FIELDS.frequency);
    expect(getFieldById("temperature")).toBe(BUILT_IN_FIELDS.temperature);
    expect(getFieldById("elapsed-time")).toBe(BUILT_IN_FIELDS.elapsedTime);
    expect(getFieldById("missing")).toBe(BUILT_IN_FIELDS.value);

    expect(FIELD_LIST).toEqual([
      BUILT_IN_FIELDS.value,
      BUILT_IN_FIELDS.voltage,
      BUILT_IN_FIELDS.current,
      BUILT_IN_FIELDS.frequency,
      BUILT_IN_FIELDS.temperature,
      BUILT_IN_FIELDS.elapsedTime,
    ]);
  });
});

import { convertUnitValue, findUnitInText } from "./units";

describe("convertUnitValue", () => {
  it("converts electrical units", () => {
    expect(convertUnitValue("current", 250, "mA", "A")).toBeCloseTo(0.25);
    expect(convertUnitValue("voltage", 2.5, "V", "mV")).toBeCloseTo(2500);
  });

  it("converts temperature units", () => {
    expect(convertUnitValue("temperature", 32, "°F", "°C")).toBeCloseTo(0);
    expect(convertUnitValue("temperature", 100, "°C", "°F")).toBeCloseTo(212);
  });

  it("returns the value unchanged for the same unit", () => {
    expect(convertUnitValue("current", 2.5, "A", "A")).toBe(2.5);
  });

  it("detects the most specific OCR unit", () => {
    expect(findUnitInText("voltage", "31.2mV")).toBe("mV");
    expect(findUnitInText("current", "250 µA")).toBe("µA");
    expect(findUnitInText("temperature", "72.5 °F")).toBe("°F");
  });

  it("keeps 31.2 mV as 31.2 mV", () => {
    expect(convertUnitValue("voltage", 31.2, "mV", "mV")).toBe(31.2);
  });
});

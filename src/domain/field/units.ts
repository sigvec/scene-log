import { getUnitsForField } from "./builtInFields";

function normalizeUnit(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/μ/g, "µ")
    .replace(/\s+/g, "");
}

function canonicalUnit(text: string): string {
  const normalized = normalizeUnit(text);

  switch (normalized) {
    case "v":
    case "mv":
    case "kv":
    case "a":
    case "ma":
    case "µa":
    case "hz":
    case "khz":
    case "mhz":
    case "k":
      return normalized;
    case "c":
    case "°c":
      return "°c";
    case "f":
    case "°f":
      return "°f";
    default:
      return normalized;
  }
}

/** Find the most specific supported unit appearing in OCR text. */
export function findUnitInText(fieldId: string, text: string): string | null {
  const normalizedText = normalizeUnit(text);
  const units = getUnitsForField(fieldId)
    .slice()
    .sort((a, b) => normalizeUnit(b).length - normalizeUnit(a).length);

  return (
    units.find((unit) => {
      const normalizedUnit = normalizeUnit(unit);
      return normalizedText.includes(normalizedUnit);
    }) ?? null
  );
}

export function convertUnitValue(
  fieldId: string,
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  const from = canonicalUnit(fromUnit);
  const to = canonicalUnit(toUnit);

  if (from === to) {
    return value;
  }

  if (!getUnitsForField(fieldId).some((unit) => canonicalUnit(unit) === from)) {
    return null;
  }

  if (!getUnitsForField(fieldId).some((unit) => canonicalUnit(unit) === to)) {
    return null;
  }

  if (fieldId === "temperature") {
    if (from === "°c" && to === "°f") return (value * 9) / 5 + 32;
    if (from === "°f" && to === "°c") return ((value - 32) * 5) / 9;
    if (from === "°c" && to === "k") return value + 273.15;
    if (from === "k" && to === "°c") return value - 273.15;
    if (from === "°f" && to === "k") return ((value - 32) * 5) / 9 + 273.15;
    if (from === "k" && to === "°f") return ((value - 273.15) * 9) / 5 + 32;
    return null;
  }

  const factors: Record<string, number> = {
    v: 1,
    mv: 1e-3,
    kv: 1e3,
    a: 1,
    ma: 1e-3,
    "µa": 1e-6,
    hz: 1,
    khz: 1e3,
    mhz: 1e6,
    k: 1,
  };

  const fromFactor = factors[from];
  const toFactor = factors[to];

  if (fromFactor === undefined || toFactor === undefined) {
    return null;
  }

  return (value * fromFactor) / toFactor;
}

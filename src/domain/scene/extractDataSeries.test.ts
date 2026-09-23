import { createCapture } from "../capture/createCapture";
import { createObservation } from "../observation/createObservation";
import type { SceneObservationField } from "./SceneObservationField";
import { extractDataSeries } from "./extractDataSeries";

function sceneField(
  id: string,
  fieldId: string,
  label?: string,
  unit?: string | null,
): SceneObservationField {
  return {
    id,
    fieldId,
    ...(label ? { label } : {}),
    ...(unit !== undefined ? { unit } : {}),
  };
}

function observation(
  id: string,
  createdAt: string,
  fieldValues: Array<{
    fieldId: string;
    valueType: "number" | "duration";
    value: number;
    unit?: string | null;
    sceneFieldId?: string;
  }>,
) {
  const result = createObservation("scene-1");
  return {
    ...result,
    id,
    createdAt: new Date(createdAt),
    captures: [createCapture(fieldValues)],
  };
}

describe("extractDataSeries", () => {
  const frequency = sceneField("frequency", "frequency", "Frequency", "Hz");
  const output = sceneField("output", "voltage", "Output Voltage", "V");

  it("extracts chronological X/Y points", () => {
    const observations = [
      observation("obs-2", "2026-09-23T10:02:00.000Z", [
        {
          fieldId: "frequency",
          valueType: "number",
          value: 2000,
          unit: "Hz",
          sceneFieldId: frequency.id,
        },
        {
          fieldId: "voltage",
          valueType: "number",
          value: 0.79,
          unit: "V",
          sceneFieldId: output.id,
        },
      ]),
      observation("obs-1", "2026-09-23T10:01:00.000Z", [
        {
          fieldId: "frequency",
          valueType: "number",
          value: 1,
          unit: "kHz",
          sceneFieldId: frequency.id,
        },
        {
          fieldId: "voltage",
          valueType: "number",
          value: 820,
          unit: "mV",
          sceneFieldId: output.id,
        },
      ]),
    ];

    const series = extractDataSeries(
      observations,
      [frequency, output],
      frequency.id,
      output.id,
    );

    expect(series).not.toBeNull();
    expect(series?.xUnit).toBe("Hz");
    expect(series?.yUnit).toBe("V");
    expect(series?.points).toHaveLength(2);
    expect(series?.points[0]).toMatchObject({
      observationId: "obs-1",
      observationCreatedAt: new Date("2026-09-23T10:01:00.000Z"),
      x: 1000,
    });
    expect(series?.points[0].y).toBeCloseTo(0.82, 12);
    expect(series?.points[1]).toMatchObject({
      observationId: "obs-2",
      observationCreatedAt: new Date("2026-09-23T10:02:00.000Z"),
      x: 2000,
    });
    expect(series?.points[1].y).toBeCloseTo(0.79, 12);
    expect(series?.skipped).toEqual([]);
  });

  it("reports missing and ambiguous observations instead of guessing", () => {
    const missingY = observation("missing-y", "2026-09-23T10:01:00.000Z", [
      {
        fieldId: "frequency",
        valueType: "number",
        value: 1000,
        unit: "Hz",
        sceneFieldId: frequency.id,
      },
    ]);
    const multipleX = observation("multiple-x", "2026-09-23T10:02:00.000Z", [
      {
        fieldId: "frequency",
        valueType: "number",
        value: 1000,
        unit: "Hz",
        sceneFieldId: frequency.id,
      },
      {
        fieldId: "frequency",
        valueType: "number",
        value: 2000,
        unit: "Hz",
        sceneFieldId: frequency.id,
      },
      {
        fieldId: "voltage",
        valueType: "number",
        value: 0.8,
        unit: "V",
        sceneFieldId: output.id,
      },
    ]);

    const series = extractDataSeries(
      [missingY, multipleX],
      [frequency, output],
      frequency.id,
      output.id,
    );

    expect(series?.points).toEqual([]);
    expect(series?.skipped).toEqual([
      { observationId: "missing-y", reason: "missing-y" },
      { observationId: "multiple-x", reason: "multiple-x" },
    ]);
  });

  it("normalizes values to the Scene field units", () => {
    const series = extractDataSeries(
      [
        observation("obs-1", "2026-09-23T10:00:00.000Z", [
          {
            fieldId: "frequency",
            valueType: "number",
            value: 2,
            unit: "kHz",
            sceneFieldId: frequency.id,
          },
          {
            fieldId: "voltage",
            valueType: "number",
            value: 750,
            unit: "mV",
            sceneFieldId: output.id,
          },
        ]),
      ],
      [frequency, output],
      frequency.id,
      output.id,
    );

    expect(series?.points[0].x).toBe(2000);
    expect(series?.points[0].y).toBeCloseTo(0.75);
  });

  it("supports duration fields", () => {
    const elapsed = sceneField("elapsed", "elapsed-time", "Elapsed Time", null);
    const value = sceneField("value", "value", "Value", null);

    const series = extractDataSeries(
      [
        observation("obs-1", "2026-09-23T10:00:00.000Z", [
          {
            fieldId: "elapsed-time",
            valueType: "duration",
            value: 90_000,
            unit: null,
            sceneFieldId: elapsed.id,
          },
          {
            fieldId: "value",
            valueType: "number",
            value: 12.5,
            unit: null,
            sceneFieldId: value.id,
          },
        ]),
      ],
      [elapsed, value],
      elapsed.id,
      value.id,
    );

    expect(series?.points).toHaveLength(1);
    expect(series?.points[0]).toMatchObject({ x: 90_000, y: 12.5 });
  });

  it("returns null when either selected Scene field does not exist", () => {
    expect(
      extractDataSeries([], [frequency], frequency.id, "missing"),
    ).toBeNull();
  });
});

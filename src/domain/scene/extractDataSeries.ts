import { getFieldById } from "../field/builtInFields";
import type { FieldValue } from "../field/FieldValue";
import type { Observation } from "../observation/Observation";
import type { SceneObservationField } from "./SceneObservationField";
import { convertUnitValue } from "../field/units";

export type DataSeriesSkipReason =
  | "missing-x"
  | "missing-y"
  | "multiple-x"
  | "multiple-y"
  | "incompatible-x-type"
  | "incompatible-y-type"
  | "incompatible-x-unit"
  | "incompatible-y-unit";

export interface DataSeriesPoint {
  readonly observationId: string;
  readonly observationCreatedAt: Date;
  readonly x: number;
  readonly y: number;
}

export interface DataSeriesSkippedObservation {
  readonly observationId: string;
  readonly reason: DataSeriesSkipReason;
}

export interface DataSeries {
  readonly xSceneFieldId: string;
  readonly ySceneFieldId: string;
  readonly xFieldId: string;
  readonly yFieldId: string;
  readonly xUnit: string | null;
  readonly yUnit: string | null;
  readonly points: DataSeriesPoint[];
  readonly skipped: DataSeriesSkippedObservation[];
}

function valuesForSceneField(
  observation: Observation,
  sceneFieldId: string,
): FieldValue[] {
  return observation.captures.flatMap((capture) =>
    capture.fieldValues.filter(
      (fieldValue) => fieldValue.sceneFieldId === sceneFieldId,
    ),
  );
}

function normalizeValue(
  fieldValue: FieldValue,
  sceneField: SceneObservationField,
): number | null {
  const field = getFieldById(sceneField.fieldId);

  if (fieldValue.valueType !== field.valueType) {
    return null;
  }

  if (field.valueType === "duration") {
    return fieldValue.value;
  }

  const targetUnit = sceneField.unit ?? field.unit;
  const sourceUnit = fieldValue.unit ?? targetUnit;

  if (!targetUnit || !sourceUnit || sourceUnit === targetUnit) {
    return fieldValue.value;
  }

  return convertUnitValue(
    sceneField.fieldId,
    fieldValue.value,
    sourceUnit,
    targetUnit,
  );
}

/**
 * Extracts one X/Y point per observation from two Scene expected fields.
 * Observations without exactly one usable value for either field are reported
 * in `skipped` rather than guessed or silently collapsed.
 */
export function extractDataSeries(
  observations: Observation[],
  sceneFields: SceneObservationField[],
  xSceneFieldId: string,
  ySceneFieldId: string,
): DataSeries | null {
  const xSceneField = sceneFields.find((field) => field.id === xSceneFieldId);
  const ySceneField = sceneFields.find((field) => field.id === ySceneFieldId);

  if (!xSceneField || !ySceneField) {
    return null;
  }

  const xField = getFieldById(xSceneField.fieldId);
  const yField = getFieldById(ySceneField.fieldId);
  const xUnit = xSceneField.unit ?? xField.unit;
  const yUnit = ySceneField.unit ?? yField.unit;

  const points: DataSeriesPoint[] = [];
  const skipped: DataSeriesSkippedObservation[] = [];

  const sortedObservations = [...observations].sort((a, b) => {
    const timeDifference = a.createdAt.getTime() - b.createdAt.getTime();
    return timeDifference !== 0
      ? timeDifference
      : a.id.localeCompare(b.id);
  });

  for (const observation of sortedObservations) {
    const xValues = valuesForSceneField(observation, xSceneField.id);
    if (xValues.length === 0) {
      skipped.push({ observationId: observation.id, reason: "missing-x" });
      continue;
    }
    if (xValues.length > 1) {
      skipped.push({ observationId: observation.id, reason: "multiple-x" });
      continue;
    }

    const yValues = valuesForSceneField(observation, ySceneField.id);
    if (yValues.length === 0) {
      skipped.push({ observationId: observation.id, reason: "missing-y" });
      continue;
    }
    if (yValues.length > 1) {
      skipped.push({ observationId: observation.id, reason: "multiple-y" });
      continue;
    }

    if (xValues[0].valueType !== xField.valueType) {
      skipped.push({
        observationId: observation.id,
        reason: "incompatible-x-type",
      });
      continue;
    }

    if (yValues[0].valueType !== yField.valueType) {
      skipped.push({
        observationId: observation.id,
        reason: "incompatible-y-type",
      });
      continue;
    }

    const x = normalizeValue(xValues[0], xSceneField);
    if (x === null) {
      skipped.push({
        observationId: observation.id,
        reason: "incompatible-x-unit",
      });
      continue;
    }

    const y = normalizeValue(yValues[0], ySceneField);
    if (y === null) {
      skipped.push({
        observationId: observation.id,
        reason: "incompatible-y-unit",
      });
      continue;
    }

    points.push({
      observationId: observation.id,
      observationCreatedAt: observation.createdAt,
      x,
      y,
    });
  }

  return {
    xSceneFieldId: xSceneField.id,
    ySceneFieldId: ySceneField.id,
    xFieldId: xSceneField.fieldId,
    yFieldId: ySceneField.fieldId,
    xUnit,
    yUnit,
    points,
    skipped,
  };
}

import { createCapture } from "../src/domain/capture/createCapture";
import type { FieldValue } from "../src/domain/field/FieldValue";
import { createObservation } from "../src/domain/observation/createObservation";
import { deserializeObservation } from "../src/domain/observation/deserializeObservation";
import { serializeObservation } from "../src/domain/observation/serializeObservation";
import {
  loadObservations,
  saveObservations,
} from "../src/services/storage/observationStorage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: require("./mocks/asyncStorage").default,
}));

describe("createObservation", () => {
  it("creates an empty observation with an id and creation date", () => {
    const observation = createObservation();

    expect(observation.id).toEqual(expect.any(String));
    expect(observation.createdAt).toBeInstanceOf(Date);
    expect(observation.captures).toEqual([]);
  });
});

describe("createCapture", () => {
  it("creates a capture with the supplied field values", () => {
    const fieldValues: FieldValue[] = [
      {
        fieldId: "value",
        valueType: "number",
        value: 12.4,
        unit: null,
      },
    ];

    const capture = createCapture(fieldValues);

    expect(capture.id).toEqual(expect.any(String));
    expect(capture.createdAt).toBeInstanceOf(Date);
    expect(capture.fieldValues).toEqual(fieldValues);
    expect(capture.sourceImageUri).toBeUndefined();
    expect(capture.templateId).toBeUndefined();
  });

  it("associates a capture with its template", () => {
    const capture = createCapture(
      [
        {
          fieldId: "voltage",
          valueType: "number",
          value: 5.02,
          unit: "V",
        },
        {
          fieldId: "elapsed-time",
          valueType: "duration",
          value: 92_000,
          unit: null,
        },
      ],
      "file:///data/images/test.jpg",
      "test-bench",
    );

    expect(capture.templateId).toBe("test-bench");
    expect(capture.sourceImageUri).toBe("file:///data/images/test.jpg");
  });
});

describe("observation serialization", () => {
  it("serializes dates as ISO strings", () => {
    const observation = createObservation();

    const serialized = serializeObservation(observation);

    expect(serialized.id).toBe(observation.id);
    expect(serialized.createdAt).toBe(observation.createdAt.toISOString());
    expect(typeof serialized.createdAt).toBe("string");
    expect(serialized.captures).toEqual([]);
  });

  it("round-trips an observation without losing its data", () => {
    const observation = createObservation();

    const capture = createCapture(
      [
        {
          fieldId: "value",
          valueType: "number",
          value: 12.4,
          unit: null,
        },
      ],
      "file:///data/images/test.jpg",
    );

    observation.captures.push(capture);

    const serialized = serializeObservation(observation);
    const restored = deserializeObservation(serialized);

    expect(restored).toEqual(observation);
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.captures[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("legacy observation image migration", () => {
  it("moves a legacy observation-level image to its captures", () => {
    const data = {
      id: "observation-1",
      createdAt: "2026-09-15T00:00:00.000Z",
      imageUri: "file:///data/images/legacy.jpg",
      captures: [
        {
          id: "capture-1",
          createdAt: "2026-09-15T00:00:01.000Z",
          fieldValues: [
            { fieldId: "value", valueType: "number" as const, value: 12.4, unit: null },
          ],
        },
      ],
    };

    const restored = deserializeObservation(data);

    expect(restored.captures[0].sourceImageUri).toBe(
      "file:///data/images/legacy.jpg",
    );
  });
});

describe("observation storage", () => {
  beforeEach(async () => {
    const AsyncStorage = require("./mocks/asyncStorage").default;
    await AsyncStorage.clear();
  });

  it("saves and loads observations", async () => {
    const observation = createObservation();

    observation.captures.push(
      createCapture(
        [
          {
            fieldId: "value",
            valueType: "number",
            value: 12.4,
          },
        ],
        "file:///data/images/test.jpg",
      ),
    );

    await saveObservations([observation]);

    const loaded = await loadObservations();

    expect(loaded).toEqual([observation]);
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
    expect(loaded[0].captures[0].createdAt).toBeInstanceOf(Date);
  });

  it("returns an empty array when no observations are stored", async () => {
    const loaded = await loadObservations();

    expect(loaded).toEqual([]);
  });
});


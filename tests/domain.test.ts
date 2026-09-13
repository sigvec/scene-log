import { createCapture } from "../src/domain/capture/createCapture";
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
    const fieldValues = [
      {
        fieldId: "value",
        value: 12.4,
      },
    ];

    const capture = createCapture(fieldValues);

    expect(capture.id).toEqual(expect.any(String));
    expect(capture.createdAt).toBeInstanceOf(Date);
    expect(capture.fieldValues).toEqual(fieldValues);
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

    const capture = createCapture([
      {
        fieldId: "value",
        value: 12.4,
      },
    ]);

    observation.captures.push(capture);
    observation.imageUri = "file:///data/images/test.jpg";

    const serialized = serializeObservation(observation);
    const restored = deserializeObservation(serialized);

    expect(restored).toEqual(observation);
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.captures[0].createdAt).toBeInstanceOf(Date);
  });
});

describe("observation storage", () => {
  beforeEach(async () => {
    const AsyncStorage = require("./mocks/asyncStorage").default;
    await AsyncStorage.clear();
  });

  it("saves and loads observations", async () => {
    const observation = createObservation();

    observation.imageUri = "file:///data/images/test.jpg";
    observation.captures.push(
      createCapture([
        {
          fieldId: "value",
          value: 12.4,
        },
      ]),
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

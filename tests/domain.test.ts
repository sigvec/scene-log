import { createCapture } from "../src/domain/capture/createCapture";
import { createObservation } from "../src/domain/observation/createObservation";
import { deserializeObservation } from "../src/domain/observation/deserializeObservation";
import { serializeObservation } from "../src/domain/observation/serializeObservation";

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

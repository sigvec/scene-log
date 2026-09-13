import { createCapture } from "../src/domain/capture/createCapture";
import { createObservation } from "../src/domain/observation/createObservation";

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

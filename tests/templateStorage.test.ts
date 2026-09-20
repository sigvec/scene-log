import { createTemplate } from "../src/domain/template/createTemplate";
import {
  loadTemplates,
  saveTemplates,
} from "../src/services/storage/templateStorage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: require("./mocks/asyncStorage").default,
}));

describe("template storage", () => {
  beforeEach(async () => {
    const AsyncStorage = require("./mocks/asyncStorage").default;
    await AsyncStorage.clear();
  });

  it("saves and loads templates", async () => {
    const template = createTemplate("Electrical Test", [
      { id: "voltage", fieldId: "voltage", unit: "V" },
      { id: "current", fieldId: "current", unit: "mA" },
      { id: "frequency", fieldId: "frequency", unit: "Hz" },
    ]);

    await saveTemplates([template]);

    const loaded = await loadTemplates();

    expect(loaded).toEqual([template]);
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
    expect(loaded[0].updatedAt).toBeInstanceOf(Date);
  });

  it("returns an empty array when no templates are stored", async () => {
    const loaded = await loadTemplates();

    expect(loaded).toEqual([]);
  });

  it("preserves repeated fields and unit overrides", async () => {
    const first = createTemplate("Electrical Test", [
      { id: "sample", fieldId: "voltage", unit: "V" },
      { id: "detector", fieldId: "voltage", unit: "mV" },
    ]);

    const second = createTemplate("Timing Test", [
      { id: "elapsed", fieldId: "elapsed-time" },
      { id: "temperature", fieldId: "temperature", unit: "°F" },
    ]);

    await saveTemplates([first, second]);

    const loaded = await loadTemplates();

    expect(loaded).toEqual([first, second]);
  });
});

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
      "voltage",
      "current",
      "frequency",
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

  it("preserves multiple templates", async () => {
    const first = createTemplate("Electrical Test", ["voltage", "current"]);

    const second = createTemplate("Timing Test", ["elapsedTime", "value"]);

    await saveTemplates([first, second]);

    const loaded = await loadTemplates();

    expect(loaded).toEqual([first, second]);
  });
});

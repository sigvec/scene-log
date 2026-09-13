const mockCreate = jest.fn();
const mockCopy = jest.fn();

describe("copyImageToStorage", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.doMock("expo-file-system", () => ({
      Directory: jest.fn().mockImplementation(() => ({
        uri: "file:///documents/images",
        create: mockCreate,
      })),
      File: jest.fn().mockImplementation((uriOrDirectory, fileName) => ({
        uri:
          typeof uriOrDirectory === "string"
            ? uriOrDirectory
            : `file:///documents/images/${fileName}`,
        copy: mockCopy,
      })),
      Paths: {
        document: "file:///documents",
      },
    }));
  });

  it("copies an image into the application image directory", async () => {
    const {
      copyImageToStorage,
    } = require("../src/services/storage/imageStorage");

    const sourceUri = "file:///temporary/captured-image.jpg";

    const result = await copyImageToStorage(sourceUri);

    expect(mockCreate).toHaveBeenCalledWith({
      idempotent: true,
      intermediates: true,
    });

    expect(mockCopy).toHaveBeenCalledTimes(1);

    expect(result).toMatch(
      /^file:\/\/\/documents\/images\/\d+-[a-z0-9]+\.jpg$/,
    );
  });
});

import { Directory, File, Paths } from "expo-file-system";

const IMAGE_DIRECTORY = new Directory(Paths.document, "images");

function generateFileName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
}

export async function copyImageToStorage(sourceUri: string): Promise<string> {
  IMAGE_DIRECTORY.create({ idempotent: true, intermediates: true });

  const source = new File(sourceUri);
  const destination = new File(IMAGE_DIRECTORY, generateFileName());

  source.copy(destination);

  return destination.uri;
}

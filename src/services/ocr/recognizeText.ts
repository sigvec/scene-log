import { recognizeText as recognizeWithMlKit } from "expo-mlkit-ocr";
import type { TextRegion } from "./TextRegion";

export async function recognizeText(imageUri: string): Promise<TextRegion[]> {
  const result = await recognizeWithMlKit(imageUri);

  return result.blocks.flatMap((block) =>
    block.lines.flatMap((line) =>
      line.elements.map((element) => ({
        text: element.text,
        bounds: element.boundingBox,
      })),
    ),
  );
}

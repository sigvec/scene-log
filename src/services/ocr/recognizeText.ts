import type { TextRegion } from "./TextRegion";

export type RecognizeText = (imageUri: string) => Promise<TextRegion[]>;

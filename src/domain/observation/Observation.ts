import type { Capture } from "../capture/Capture";

export interface Observation {
  readonly id: string;
  readonly createdAt: Date;
  imageUri?: string;
  captures: Capture[];
}

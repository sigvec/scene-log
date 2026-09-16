import type { FieldValue } from "../field/FieldValue";

export interface ObservationData {
  id: string;
  createdAt: string;
  /** Legacy observation-level image URI retained for migration of existing data. */
  imageUri?: string;
  captures: {
    id: string;
    createdAt: string;
    sourceImageUri?: string;
    fieldValues: FieldValue[];
  }[];
}

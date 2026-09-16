import type { FieldValue } from "../field/FieldValue";
import type { FieldValueType } from "../field/FieldValueType";

export interface ObservationData {
  id: string;
  createdAt: string;
  /** Legacy observation-level image URI retained for migration of existing data. */
  imageUri?: string;
  captures: {
    id: string;
    createdAt: string;
    sourceImageUri?: string;
    /** Optional because v0.2 persisted field values without a value type. */
    fieldValues: Array<Omit<FieldValue, "valueType"> & { valueType?: FieldValueType }>;
  }[];
}

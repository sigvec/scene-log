import type { FieldValue } from "../field/FieldValue";

export interface Capture {
  readonly id: string;
  readonly createdAt: Date;
  sourceImageUri?: string;
  fieldValues: FieldValue[];
}

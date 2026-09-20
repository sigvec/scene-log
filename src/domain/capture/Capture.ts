import type { FieldValue } from "../field/FieldValue";

export interface Capture {
  readonly id: string;
  readonly createdAt: Date;
  templateId?: string;
  sourceImageUri?: string;
  fieldValues: FieldValue[];
}

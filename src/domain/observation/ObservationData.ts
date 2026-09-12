import type { FieldValue } from "../field/FieldValue";

export interface ObservationData {
  id: string;
  createdAt: string;
  captures: {
    id: string;
    createdAt: string;
    fieldValues: FieldValue[];
  }[];
}

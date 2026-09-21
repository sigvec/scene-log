export interface ObservationData {
  id: string;
  sceneId?: string;
  createdAt: string;
  imageUri?: string;
  captures: Array<{
    id: string;
    createdAt: string;
    templateId?: string;
    sourceImageUri?: string;
    fieldValues: Array<{
      fieldId: string;
      templateFieldId?: string;
      valueType: "number" | "duration";
      value: number;
      unit?: string | null;
    }>;
  }>;
}

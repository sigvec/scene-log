import type { Template } from "./Template";
import type { TemplateField } from "./TemplateField";
import type { SerializedTemplate } from "./serializeTemplate";

function createLegacyFieldId(templateId: string, index: number): string {
  return `${templateId}-field-${index}`;
}

export function deserializeTemplate(data: SerializedTemplate): Template {
  const fields: TemplateField[] = data.fields
    ? data.fields.map((field) => ({ ...field }))
    : (data.fieldIds ?? []).map((fieldId, index) => ({
        id: createLegacyFieldId(data.id, index),
        fieldId,
      }));

  return {
    id: data.id,
    name: data.name,
    fields,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

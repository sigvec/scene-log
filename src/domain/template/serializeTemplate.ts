import type { Template } from "./Template";
import type { TemplateField } from "./TemplateField";

export interface SerializedTemplate {
  id: string;
  name: string;
  fields?: TemplateField[];
  /** Legacy v0.4 representation. */
  fieldIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export function serializeTemplate(template: Template): SerializedTemplate {
  return {
    id: template.id,
    name: template.name,
    fields: template.fields.map((field) => ({ ...field })),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

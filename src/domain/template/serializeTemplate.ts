import type { Template } from "./Template";

export interface SerializedTemplate {
  id: string;
  name: string;
  fieldIds: string[];
  createdAt: string;
  updatedAt: string;
}

export function serializeTemplate(template: Template): SerializedTemplate {
  return {
    id: template.id,
    name: template.name,
    fieldIds: [...template.fieldIds],
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

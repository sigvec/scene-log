import type { Template } from "./Template";
import type { SerializedTemplate } from "./serializeTemplate";

export function deserializeTemplate(data: SerializedTemplate): Template {
  return {
    id: data.id,
    name: data.name,
    fieldIds: [...data.fieldIds],
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

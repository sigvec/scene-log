import type { Template } from "./Template";
import type { TemplateField } from "./TemplateField";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTemplate(
  name: string,
  fields: TemplateField[],
): Template {
  const now = new Date();

  return {
    id: generateId(),
    name,
    fields: [...fields],
    createdAt: now,
    updatedAt: now,
  };
}

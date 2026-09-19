import type { Template } from "./Template";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTemplate(name: string, fieldIds: string[]): Template {
  const now = new Date();

  return {
    id: generateId(),
    name,
    fieldIds,
    createdAt: now,
    updatedAt: now,
  };
}

import type { Project } from "./Project";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createProject(name: string): Project {
  const now = new Date();

  return {
    id: generateId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

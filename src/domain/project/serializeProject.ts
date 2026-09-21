import type { Project } from "./Project";

export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeProject(project: Project): ProjectData {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

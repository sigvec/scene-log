import type { Project } from "./Project";
import type { ProjectData } from "./serializeProject";

export function deserializeProject(data: ProjectData): Project {
  return {
    id: data.id,
    name: data.name,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

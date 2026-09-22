import type { Scene } from "./Scene";
import type { SceneData } from "./serializeScene";

export function deserializeScene(data: SceneData): Scene {
  return {
    id: data.id,
    projectId: data.projectId,
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    observationFields: data.observationFields ?? [],
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

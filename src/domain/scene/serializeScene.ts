import type { Scene } from "./Scene";

export interface SceneData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeScene(scene: Scene): SceneData {
  return {
    id: scene.id,
    projectId: scene.projectId,
    name: scene.name,
    ...(scene.description ? { description: scene.description } : {}),
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

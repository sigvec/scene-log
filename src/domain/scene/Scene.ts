import type { SceneObservationField } from "./SceneObservationField";

export interface Scene {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description?: string;
  readonly observationFields: SceneObservationField[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

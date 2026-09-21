export interface Scene {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

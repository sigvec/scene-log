export interface Template {
  readonly id: string;
  readonly name: string;
  readonly fieldIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

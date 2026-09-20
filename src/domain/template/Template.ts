import type { TemplateField } from "./TemplateField";

export interface Template {
  readonly id: string;
  readonly name: string;
  readonly fields: TemplateField[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

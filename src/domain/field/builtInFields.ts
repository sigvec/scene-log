import type { Field } from "./Field";

export const BUILT_IN_FIELDS = {
  value: {
    id: "value",
    name: "Value",
  } satisfies Field,
} as const;

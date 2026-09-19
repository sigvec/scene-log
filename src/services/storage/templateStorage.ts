import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Template } from "../../domain/template/Template";
import { deserializeTemplate } from "../../domain/template/deserializeTemplate";
import { serializeTemplate } from "../../domain/template/serializeTemplate";

const TEMPLATES_KEY = "scenelog.templates";

export async function saveTemplates(templates: Template[]): Promise<void> {
  const data = templates.map(serializeTemplate);
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(data));
}

export async function loadTemplates(): Promise<Template[]> {
  const stored = await AsyncStorage.getItem(TEMPLATES_KEY);

  if (!stored) {
    return [];
  }

  const data = JSON.parse(stored);

  return data.map(deserializeTemplate);
}

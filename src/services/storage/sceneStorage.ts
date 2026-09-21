import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Scene } from "../../domain/scene/Scene";
import { deserializeScene } from "../../domain/scene/deserializeScene";
import { serializeScene } from "../../domain/scene/serializeScene";

const SCENES_KEY = "scenelog.scenes";

export async function saveScenes(scenes: Scene[]): Promise<void> {
  await AsyncStorage.setItem(SCENES_KEY, JSON.stringify(scenes.map(serializeScene)));
}

export async function loadScenes(): Promise<Scene[]> {
  const stored = await AsyncStorage.getItem(SCENES_KEY);
  if (!stored) return [];
  return (JSON.parse(stored) as ReturnType<typeof serializeScene>[]).map(deserializeScene);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Project } from "../../domain/project/Project";
import { deserializeProject } from "../../domain/project/deserializeProject";
import { serializeProject } from "../../domain/project/serializeProject";

const PROJECTS_KEY = "scenelog.projects";

export async function saveProjects(projects: Project[]): Promise<void> {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.map(serializeProject)));
}

export async function loadProjects(): Promise<Project[]> {
  const stored = await AsyncStorage.getItem(PROJECTS_KEY);
  if (!stored) return [];
  return (JSON.parse(stored) as ReturnType<typeof serializeProject>[]).map(deserializeProject);
}

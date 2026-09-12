import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Observation } from "../../domain/observation/Observation";
import { deserializeObservation } from "../../domain/observation/deserializeObservation";
import { serializeObservation } from "../../domain/observation/serializeObservation";

const OBSERVATIONS_KEY = "scenelog.observations";

export async function saveObservations(
  observations: Observation[],
): Promise<void> {
  const data = observations.map(serializeObservation);
  await AsyncStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(data));
}

export async function loadObservations(): Promise<Observation[]> {
  const stored = await AsyncStorage.getItem(OBSERVATIONS_KEY);

  if (!stored) {
    return [];
  }

  const data = JSON.parse(stored);

  return data.map(deserializeObservation);
}

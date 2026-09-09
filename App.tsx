import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeObservation, setActiveObservation] =
    useState<Observation | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  async function handleNewObservation() {
    const observation = createObservation();

    setObservations((current) => [...current, observation]);
    setActiveObservation(observation);
    setCapturedImageUri(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    setCapturedImageUri(result.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SceneLog</Text>

      <Pressable style={styles.button} onPress={handleNewObservation}>
        <Text style={styles.buttonText}>New Observation</Text>
      </Pressable>

      {activeObservation && (
        <View style={styles.activeObservation}>
          <Text style={styles.sectionTitle}>Observation</Text>

          <Text style={styles.timestamp}>
            {activeObservation.createdAt.toLocaleTimeString()}
          </Text>

          {capturedImageUri && (
            <Image source={{ uri: capturedImageUri }} style={styles.image} />
          )}

          <Text style={styles.captureStatus}>
            {activeObservation.captures.length === 0
              ? "No measurements recorded"
              : `${activeObservation.captures.length} measurement(s)`}
          </Text>
        </View>
      )}

      {!activeObservation && (
        <View style={styles.observations}>
          <Text style={styles.sectionTitle}>Observations</Text>

          {observations.map((observation) => (
            <Text key={observation.id} style={styles.observation}>
              {observation.createdAt.toLocaleTimeString()}
            </Text>
          ))}
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 32,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  activeObservation: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  image: {
    width: "100%",
    height: 300,
    marginTop: 24,
    borderRadius: 8,
  },
  captureStatus: {
    marginTop: 16,
    fontSize: 16,
  },
  observations: {
    marginTop: 48,
  },
  observation: {
    fontSize: 16,
    paddingVertical: 8,
  },
});

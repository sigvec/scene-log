import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  async function handleNewObservation() {
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

    const observation = createObservation();
    setObservations((current) => [...current, observation]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SceneLog</Text>

      <Pressable style={styles.button} onPress={handleNewObservation}>
        <Text style={styles.buttonText}>New Observation</Text>
      </Pressable>

      {capturedImageUri && (
        <Image source={{ uri: capturedImageUri }} style={styles.image} />
      )}

      <View style={styles.observations}>
        <Text style={styles.sectionTitle}>Observations</Text>

        {observations.map((observation) => (
          <Text key={observation.id} style={styles.observation}>
            {observation.createdAt.toLocaleTimeString()}
          </Text>
        ))}
      </View>

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
  image: {
    width: "100%",
    height: 300,
    marginTop: 32,
    borderRadius: 8,
  },
  observations: {
    marginTop: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  observation: {
    fontSize: 16,
    paddingVertical: 8,
  },
});

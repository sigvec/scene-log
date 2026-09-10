import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Observation } from "./src/domain/observation/Observation";
import { createObservation } from "./src/domain/observation/createObservation";
import type { TextRegion } from "./src/services/ocr/TextRegion";
import { recognizeText } from "./src/services/ocr/recognizeText";

function getContainTransform(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );

  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;

  return {
    scale,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: (containerHeight - renderedHeight) / 2,
  };
}

function parseNumericValue(text: string): number | null {
  const match = text.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)/);

  if (!match) {
    return null;
  }

  const value = Number(match[0]);

  return Number.isFinite(value) ? value : null;
}

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeObservation, setActiveObservation] =
    useState<Observation | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [textRegions, setTextRegions] = useState<TextRegion[]>([]);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | null>(
    null,
  );

  async function handleNewObservation() {
    const observation = createObservation();

    setImageSize(null);
    setContainerSize(null);
    setTextRegions([]);
    setSelectedRegionIndex(null);

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

    const asset = result.assets[0];

    setCapturedImageUri(asset.uri);
    setImageSize({
      width: asset.width,
      height: asset.height,
    });

    const regions = await recognizeText(asset.uri);
    setTextRegions(regions);
  }

  const selectedRegion =
    selectedRegionIndex !== null ? textRegions[selectedRegionIndex] : null;

  const selectedNumericValue = selectedRegion
    ? parseNumericValue(selectedRegion.text)
    : null;

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

          {capturedImageUri && imageSize && (
            <View
              style={styles.imageContainer}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;

                setContainerSize({ width, height });
              }}
            >
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.image}
                resizeMode="contain"
              />

              {containerSize &&
                textRegions.map((region, index) => {
                  const transform = getContainTransform(
                    imageSize.width,
                    imageSize.height,
                    containerSize.width,
                    containerSize.height,
                  );

                  return (
                    <Pressable
                      key={`${region.text}-${index}`}
                      onPress={() => setSelectedRegionIndex(index)}
                      style={[
                        styles.textRegion,
                        selectedRegionIndex === index &&
                          styles.selectedTextRegion,
                        {
                          left:
                            transform.offsetX +
                            region.bounds.x * transform.scale,
                          top:
                            transform.offsetY +
                            region.bounds.y * transform.scale,
                          width: region.bounds.width * transform.scale,
                          height: region.bounds.height * transform.scale,
                        },
                      ]}
                    />
                  );
                })}
            </View>
          )}

          {selectedRegion && (
            <View style={styles.selectedValue}>
              <Text style={styles.selectedValueLabel}>Selected value</Text>

              <Text style={styles.selectedValueText}>
                {selectedRegion.text}
              </Text>

              {selectedNumericValue !== null && (
                <Text style={styles.parsedValue}>
                  Numeric value: {selectedNumericValue}
                </Text>
              )}
            </View>
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
    height: "100%",
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
  imageContainer: {
    width: "100%",
    height: 300,
    marginTop: 24,
    position: "relative",
    overflow: "hidden",
  },
  textRegion: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00aaff",
  },
  selectedTextRegion: {
    borderColor: "#ff6600",
    backgroundColor: "rgba(255, 102, 0, 0.15)",
  },
  selectedValue: {
    marginTop: 24,
  },

  selectedValueLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },

  selectedValueText: {
    fontSize: 24,
    fontWeight: "600",
  },

  parsedValue: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },
});

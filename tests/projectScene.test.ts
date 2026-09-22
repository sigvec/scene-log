import { createProject } from "../src/domain/project/createProject";
import { deserializeProject } from "../src/domain/project/deserializeProject";
import { serializeProject } from "../src/domain/project/serializeProject";
import { createScene } from "../src/domain/scene/createScene";
import { deserializeScene } from "../src/domain/scene/deserializeScene";
import { serializeScene } from "../src/domain/scene/serializeScene";
import { createSceneObservationField } from "../src/domain/scene/SceneObservationField";

describe("Project and Scene", () => {
  it("round-trips a project through serialization", () => {
    const project = createProject("Battery characterization");
    expect(deserializeProject(serializeProject(project))).toEqual(project);
  });

  it("creates a scene within a project", () => {
    const project = createProject("Battery characterization");
    const scene = createScene(project.id, "Cell A", "Baseline measurements");

    expect(scene.projectId).toBe(project.id);
    expect(scene.name).toBe("Cell A");
    expect(scene.description).toBe("Baseline measurements");
  });

  it("supports expected observation fields within a scene", () => {
    const expected = createSceneObservationField("voltage", "V", "Input voltage");
    const scene = createScene("project-1", "Sweep", undefined, [expected]);

    expect(scene.observationFields).toEqual([expected]);
    expect(scene.observationFields[0].label).toBe("Input voltage");
  });

  it("round-trips a scene through serialization", () => {
    const expected = createSceneObservationField("frequency", "Hz", "Frequency");
    const scene = createScene("project-1", "Frequency sweep", undefined, [expected]);
    expect(deserializeScene(serializeScene(scene))).toEqual(scene);
  });

  it("loads legacy scenes without expected fields", () => {
    const scene = deserializeScene({
      id: "scene-1",
      projectId: "project-1",
      name: "Legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(scene.observationFields).toEqual([]);
  });
});

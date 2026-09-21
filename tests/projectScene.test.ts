import { createProject } from "../src/domain/project/createProject";
import { deserializeProject } from "../src/domain/project/deserializeProject";
import { serializeProject } from "../src/domain/project/serializeProject";
import { createScene } from "../src/domain/scene/createScene";
import { deserializeScene } from "../src/domain/scene/deserializeScene";
import { serializeScene } from "../src/domain/scene/serializeScene";

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

  it("round-trips a scene through serialization", () => {
    const scene = createScene("project-1", "Frequency sweep");
    expect(deserializeScene(serializeScene(scene))).toEqual(scene);
  });
});

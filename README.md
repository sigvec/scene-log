# SceneLog

SceneLog is a mobile app for recording observations from the physical world.

It is designed with laboratory and experimental work in mind, where measurements and instrument readings often need to be captured alongside the physical setup in which they were taken. It is not limited to laboratory use, however, and can be used wherever observations of the physical world need to be recorded and organized.

The application is organized around Projects, Scenes, Observations, Captures, and Field Values, allowing users to choose how much structure is useful for a particular piece of work. Scenes can also define expected observation values to provide consistent roles across a series without making those values mandatory.

## Current status

**v0.5 — Projects, Scenes, and expected observation values**

SceneLog currently supports typed measurement fields, optional units, duration measurements, reusable capture templates, project and scene organization, OCR-derived or manually entered values, local persistence, editing, and deletion.

The current built-in fields are:

- **Value** — a unitless numeric value
- **Voltage** — volts (V)
- **Current** — amperes (A)
- **Frequency** — hertz (Hz)
- **Temperature** — degrees Celsius (°C)
- **Elapsed Time** — a duration stored internally in milliseconds

## Organization model

SceneLog uses the following hierarchy:

```text
Project
  └── Scene
       └── Observation
            └── Capture
                 └── FieldValue
```

- **Project** — organizes a complete piece of work, such as a research project or investigation.
- **Scene** — provides context within a project. A scene might represent an experiment, sample, setup, experimental phase, or another useful grouping chosen by the user.
- **Observation** — records one instance of collected information within a scene.
- **Capture** — represents an individual acquisition event within an observation and can contain one or more field values.
- **FieldValue** — an individual typed value such as `5.02 V` or `1:32`.

Projects can contain multiple Scenes, and Scenes can contain multiple Observations. The model does not impose a particular interpretation of what a Scene represents; users can organize their work according to the context that is useful to them.

## Features

- Create and organize Projects
- Create multiple Scenes within a Project
- Define expected observation values for a Scene
- Give expected observation values stable identities and optional labels
- Override units for expected observation values
- Select an expected observation value when recording a measurement
- Retain the expected-value identity with the recorded FieldValue
- Add Observations to a Scene
- Capture and persist associated images locally
- On-device OCR using ML Kit
- Display detected text regions over captured images
- Select OCR results by tapping their regions
- Show the OCR pipeline explicitly:
  - Recognized text
  - Field-aware interpretation of the reading
  - Editable value
- Select individual fields for measurements
- Create reusable capture templates containing multiple field slots
- Assign custom labels to template fields
- Override units for individual template fields
- Convert values between compatible units
- Support multiple instances of the same field in a template
- Enter template measurements manually
- Capture template measurements using the camera and OCR
- Review OCR results before saving template captures
- Preserve template field identity with captured values
- Elapsed-time measurements using timer notation such as `1:30` or `1.30`
- Store duration values canonically as milliseconds
- Edit existing measurements
- Change the field associated with an existing measurement
- Manually enter a value when OCR does not produce a usable result
- Record multiple captures in a single observation
- Mix individual field captures and template-based captures within an observation
- Review completed observations
- Persist projects, scenes, observations, templates, and captured images locally
- Restore data after restarting the app
- Delete observations and their associated stored images
- Prevent deletion of projects or scenes that still contain child data
- Migrate legacy observations into a default project and scene

## Example workflow

A project might contain several experimental contexts:

```text
Project: Battery characterization

├── Scene: Cell A
│    ├── Observation
│    ├── Observation
│    └── Observation
│
├── Scene: Cell B
│    ├── Observation
│    └── Observation
│
└── Scene: High-current test
     ├── Observation
     └── Observation
```

Within an observation, captures can contain one or more values:

```text
Observation
├── Capture
│     ├── Voltage: 5.02 V
│     └── Elapsed Time: 1:32
│
├── Capture
│     └── Temperature: 23.4 °C
│
└── Capture
      ├── Voltage: 5.10 V
      └── Elapsed Time: 1:35
```

## Templates and expected observation values

SceneLog has two deliberately different levels of structure.

**Capture Templates** describe what to extract or enter during a particular acquisition. A template can contain several independently identified field slots, including repeated instances of the same underlying field.

For example:

```text
Sample voltage     → Voltage / V
Detector voltage   → Voltage / V
Current            → Current / mA
```

Scenes can independently define expected observation values. These are stable roles within the Scene, each based on a field and optionally given a user-facing label and unit override. For example:

```text
Frequency        → Frequency / Hz
Input voltage    → Voltage / V
Output voltage   → Voltage / V
Temperature      → Temperature / °C
```

When a user records an individual field capture through an expected value, the resulting FieldValue retains that expected-value identity. A Capture Template can also be used within a Scene: each template field can be assigned to a compatible Scene expected value, or left unassigned when it is not part of the Scene's expected data series. Unique field matches and matching labels are suggested automatically, while ambiguous matches remain under user control. This provides a foundation for identifying corresponding values across observations while still allowing observations to contain arbitrary additional values.

## Technology

- **React Native**
- **Expo SDK 57**
- **TypeScript**
- **Expo ML Kit OCR**
- **Expo FileSystem**
- **AsyncStorage**
- **Jest / jest-expo**

The application currently uses local device storage rather than a backend.

## Architecture

SceneLog separates the core domain model from application services and UI.

The core domain consists of:

- **Project** — top-level organization for a piece of work.
- **Scene** — contextual grouping within a Project.
- **Observation** — a recorded unit of collected information within a Scene.
- **Capture** — an acquisition/input within an Observation.
- **FieldValue** — a typed value associated with a field definition and, when applicable, a capture-template field or Scene expected-value field.
- **Field** — identifies the meaning and representation of a value, including its value type and default unit.
- **FieldValueType** — defines how a field value is represented; the current implementation supports numeric values and durations.
- **Template** — a reusable capture workflow containing one or more template field slots.
- **TemplateField** — a template-specific field slot with its own identity, underlying field, optional label, and optional unit override.
- **SceneObservationField** — a Scene-specific expected value with its own identity, underlying field, optional label, and optional unit override.

Projects and Scenes are persisted separately from Observations. Observations retain their Scene identifier, allowing the application to filter observations by context without duplicating the observation data inside Scene records.

The domain is intentionally more general than the current UI, leaving room for user-defined fields, richer analysis, and additional observation types.

## Local storage

Projects, Scenes, Observations, and Templates are serialized before being stored locally. Dates are represented as ISO 8601 strings in persisted data and reconstructed as `Date` objects when loaded.

Captured images are copied from their temporary camera location into the application's private document storage. A capture retains the stored source image URI, allowing the image to remain available after the original camera result is gone.

Deleting an observation also removes its associated stored image. Projects and Scenes cannot currently be deleted while they contain child data.

Legacy observations that predate Projects and Scenes are assigned to a generated `General Project` and `General Scene` during migration.

## Testing

The test suite covers:

- Observation creation
- Capture creation
- Built-in field definitions and value types
- Duration parsing and formatting
- Observation serialization and deserialization
- Observation persistence
- Image storage
- Image deletion
- Template creation
- Template serialization and deserialization
- Template field configuration
- Template field labels and unit overrides
- Backward-compatible template loading
- Scene expected observation fields
- Scene expected-value serialization and migration
- Template-to-Scene expected-value assignment

## Roadmap

Future work may include:

- **History and analysis** — review measurement history, identify corresponding values, and identify trends
- **Smarter acquisition and OCR** — improve reading interpretation and acquisition workflows
- **User-defined fields**
- **Additional capture types**
- **Richer observation metadata**
- **Public project sharing**

The roadmap is deliberately open-ended; future features will be added only when they fit the underlying observation model and provide a useful workflow.

## Project goals

SceneLog's goals are to demonstrate:

- Practical React Native development
- TypeScript domain modelling
- Native mobile capability integration
- On-device machine-learning/OCR integration
- Persistent local data management
- Reusable workflow and template design
- Separation between domain logic, services, and presentation
- Automated testing
- Incremental development with focused commits

## Screenshots

### Measurement capture

<p align="center">
  <img src="screenshots/MeasurementCapture.jpg" width="350">
</p>

# SceneLog

SceneLog is a mobile app for recording observations from the physical world.

It is designed with laboratory and experimental work in mind, where measurements and instrument readings often need to be captured alongside the physical setup in which they were taken. It is not limited to laboratory use, however, and can be used wherever observations of the physical world need to be recorded and organized.

Capture a scene with the camera, use on-device OCR to identify readings, review the recognized text and extracted values, edit the values if necessary, and build a collection of measurements within an observation.

The project is being developed with an emphasis on clear domain modelling, local persistence, and a practical mobile workflow.

## Current status

**v0.4 — Templates and structured capture**

SceneLog currently supports typed measurement fields, optional units, duration measurements, OCR-derived or manually entered values, reusable templates, local persistence, editing, and deletion.

The current built-in fields are:

- **Value** — a unitless numeric value
- **Voltage** — volts (V)
- **Current** — amperes (A)
- **Frequency** — hertz (Hz)
- **Temperature** — degrees Celsius (°C)
- **Elapsed Time** — a duration stored internally in milliseconds

Templates provide reusable capture workflows by defining one or more field slots. Each slot can specify:

- An underlying field
- An optional custom label
- An optional unit override

This allows a template to represent workflows such as:

```text
Sample voltage     → Voltage / V
Detector voltage   → Voltage / V
Current            → Current / mA
```

Template fields have their own stable identities, allowing the same underlying field to appear multiple times in a template while remaining independently identifiable.

## Features

- Create observations
- Capture and persist associated images locally
- On-device OCR using ML Kit
- Display detected text regions over captured images
- Select OCR results by tapping their regions
- Show the OCR pipeline explicitly:
  - Recognized text
  - Field-aware interpretation of the reading
  - Editable value

- Select individual fields for measurements
- Create reusable templates containing multiple field slots
- Assign custom labels to template fields
- Override the default unit for individual template fields
- Convert values when changing between compatible units
- Support multiple instances of the same field within a template
- Enter template measurements manually
- Capture template measurements using the camera and OCR
- Review OCR results and matched template fields before saving
- Preserve template field identity with captured values
- Elapsed-time measurements using timer notation such as `1:30` or `1.30`
- Store duration values canonically as milliseconds
- Edit existing measurements
- Change the field associated with an existing measurement
- Manually enter a value when OCR does not produce a usable result
- Record multiple captures within a single observation
- Mix individual field captures and template-based captures within the same observation
- Review completed observations
- Persist observations and captured images locally
- Restore observations after restarting the app
- Delete observations and their associated stored images
- Confirmation before destructive deletion

## Example workflow

A simple single-field capture can follow this workflow:

```text
Capture image
     ↓
Detect text with on-device OCR
     ↓
Select a reading
     ↓
Recognized text → Field-aware value
     ↓
Edit if necessary
     ↓
Save capture
```

A template capture can acquire several related values from the same image:

```text
Select template
     ↓
Capture image
     ↓
Detect text with on-device OCR
     ↓
Match readings to template fields
     ↓
Review extracted values
     ↓
Edit if necessary
     ↓
Save as one capture
```

A single observation can contain multiple captures:

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

SceneLog separates the core observation model from application services and UI.

The core domain consists of:

- **Observation** — a recorded unit of collected information.
- **Capture** — an individual acquisition/input within an observation. A capture can contain one or more field values.
- **FieldValue** — a typed value associated with a field definition and, when applicable, a template field.
- **Field** — identifies the meaning and representation of a value, including its value type and default unit.
- **FieldValueType** — defines how a field value is represented; the current implementation supports numeric values and durations.
- **Template** — a reusable capture workflow containing one or more template field slots.
- **TemplateField** — a template-specific field slot with its own identity, underlying field, optional label, and optional unit override.

Templates are associated with captures rather than observations. An observation therefore remains unrestricted: individual field captures and template-based captures can be combined freely within the same observation.

The separation between `TemplateField` identity and the underlying `Field` also allows the same field to appear multiple times in one template without losing the identity of each slot.

The domain is intentionally more general than the current UI, leaving room for future user-defined fields, richer capture workflows, scenes, and additional observation types.

## Units and values

Built-in numeric fields have default units, while templates can override those units for individual field slots.

Supported unit choices currently include:

- **Voltage:** V, mV, kV
- **Current:** A, mA, µA
- **Frequency:** Hz, kHz, MHz
- **Temperature:** °C, °F, K

Compatible unit conversions are applied consistently across manual entry, OCR capture, editing, and template workflows.

Duration fields use timer-oriented input such as:

```text
1:30
1.30
1:30.125
```

These represent 1 minute 30 seconds, 1 minute 30 seconds, and 1 minute 30.125 seconds respectively. Duration values are stored internally as milliseconds.

## Local storage

Observations and templates are serialized before being stored locally. Dates are represented as ISO 8601 strings in persisted data and reconstructed as `Date` objects when loaded.

Captured images are copied from their temporary camera location into the application's private document storage. A capture retains the stored source image URI, allowing the image to remain available after the original camera result is gone.

Deleting an observation also removes its associated stored image.

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

## Roadmap

Future work may include:

- **Scenes** — organize observations within experimental or real-world contexts
- **History and analysis** — review measurement history and identify trends
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

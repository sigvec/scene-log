# SceneLog

SceneLog is a mobile app for recording observations from the physical world.

It is designed with laboratory and experimental work in mind, where measurements and instrument readings often need to be captured alongside the physical setup in which they were taken. It is not limited to laboratory use, however, and can be used wherever observations of the physical world need to be recorded and organized.

Capture a scene with the camera, use on-device OCR to identify readings, review the recognized text and extracted numeric value, edit the value if necessary, and build a collection of measurements within an observation.

The project is being developed with an emphasis on clear domain modelling, local persistence, and a practical mobile workflow.

## Current status

**v0.3 — Fields and typed measurements**

SceneLog currently supports typed measurement fields, optional units, duration measurements, OCR-derived or manually entered values, local persistence, editing, and deletion.

The current built-in fields are:

- **Value** — a unitless numeric value
- **Voltage** — volts (V)
- **Current** — amperes (A)
- **Frequency** — hertz (Hz)
- **Temperature** — degrees Celsius (°C)
- **Elapsed Time** — a duration stored internally in milliseconds

## Features

- Create observations from the camera
- Capture and persist the associated image locally
- On-device OCR using ML Kit
- Display detected text regions over the captured image
- Select an OCR result by tapping its region
- Show the OCR pipeline explicitly:
  - Recognized text
  - Field-aware interpretation of the reading
  - Editable value
- Select a field for each measurement
- Optional units for numeric fields
- Elapsed-time measurements using timer notation such as `1:30` or `1.30`
- Store duration values canonically as milliseconds
- Edit existing measurements
- Change the field associated with an existing measurement
- Manually enter a value when OCR does not produce a usable result
- Record multiple measurements in a single observation
- Review completed observations
- Persist observations and captured images locally
- Restore observations after restarting the app
- Delete observations and their associated stored images
- Confirmation before destructive deletion

## Example workflow

```text
Capture scene
     ↓
Detect text with on-device OCR
     ↓
Select a reading
     ↓
Recognized text → Field-aware value
     ↓
Edit if necessary
     ↓
Save measurement
     ↓
Add additional measurements
     ↓
Complete observation
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

SceneLog separates the core observation model from application services and UI. The core domain currently consists of:

- **Observation** — a recorded unit of collected information.
- **Capture** — an individual interpretation/input within an observation.
- **FieldValue** — a typed value associated with a field definition.
- **Field** — identifies the meaning and representation of a value, including its value type and optional unit.
- **FieldValueType** — defines how a field value is represented; the current implementation supports numeric values and durations.

The domain is intentionally more general than the current UI. The interface currently presents a measurement workflow with built-in fields, while the underlying model provides room for user-defined fields, richer templates, and additional observation types.

## Local storage

Observations are serialized before being stored locally. Dates are represented as ISO 8601 strings in persisted data and reconstructed as `Date` objects when loaded.

Captured images are copied from their temporary camera location into the application's private document storage. A capture retains the stored source image URI, allowing the image to remain available after the original camera result is gone.

Deleting an observation also removes its associated stored image.

## Testing

The current test suite covers:

- Observation creation
- Capture creation
- Built-in field definitions and value types
- Duration parsing and formatting
- Observation serialization and deserialization
- Observation persistence
- Image storage
- Image deletion

## Roadmap

Future work may include:

- Templates — reusable groups of fields for recurring measurement workflows
- Scenes — organize observations within experimental or real-world contexts
- \*History and analysis — review measurement history and identify trends
- Smarter acquisition and OCR — improve reading interpretation and acquisition workflows
- User-defined fields
- Additional capture types
- Richer observation metadata
- Public project sharing

The roadmap is deliberately open-ended; future features will be added only when they fit the underlying observation model and provide a useful workflow.

## Project goals

SceneLog's goals are to demonstrate:

- Practical React Native development
- TypeScript domain modelling
- Native mobile capability integration
- On-device machine-learning/OCR integration
- Persistent local data management
- Separation between domain logic, services, and presentation
- Automated testing
- Incremental development with focused commits

## Screenshots

### Measurement capture

<p align="center">
  <img src="screenshots/MeasurementCapture.jpg" width="350">
</p>

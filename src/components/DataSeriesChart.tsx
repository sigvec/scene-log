import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import type { DataSeries } from "../domain/scene/extractDataSeries";
import type { SceneObservationField } from "../domain/scene/SceneObservationField";
import { getFieldById } from "../domain/field/builtInFields";
import { formatDuration } from "../domain/field/duration";

interface DataSeriesChartProps {
  series: DataSeries;
  xField: SceneObservationField;
  yField: SceneObservationField;
}

const CHART_HEIGHT = 260;
const PADDING = { top: 18, right: 18, bottom: 42, left: 52 };
const TICK_COUNT = 4;

function fieldLabel(field: SceneObservationField): string {
  return field.label?.trim() || getFieldById(field.fieldId).name;
}

function fieldUnit(field: SceneObservationField): string | null {
  return field.unit ?? getFieldById(field.fieldId).unit;
}

function formatValue(value: number, field: SceneObservationField): string {
  const definition = getFieldById(field.fieldId);
  if (definition.valueType === "duration") {
    return formatDuration(value);
  }

  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) {
    return value.toExponential(2);
  }
  return Number(value.toPrecision(4)).toString();
}

function makeTicks(min: number, max: number): number[] {
  if (min === max) return [min];
  return Array.from({ length: TICK_COUNT + 1 }, (_, index) =>
    min + ((max - min) * index) / TICK_COUNT,
  );
}

export function DataSeriesChart({ series, xField, yField }: DataSeriesChartProps) {
  const [width, setWidth] = React.useState(0);
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  if (series.points.length === 0) {
    return null;
  }

  const xValues = series.points.map((point) => point.x);
  const yValues = series.points.map((point) => point.y);
  let xMin = Math.min(...xValues);
  let xMax = Math.max(...xValues);
  let yMin = Math.min(...yValues);
  let yMax = Math.max(...yValues);

  if (xMin === xMax) {
    const padding = Math.abs(xMin) > 0 ? Math.abs(xMin) * 0.05 : 1;
    xMin -= padding;
    xMax += padding;
  }
  if (yMin === yMax) {
    const padding = Math.abs(yMin) > 0 ? Math.abs(yMin) * 0.05 : 1;
    yMin -= padding;
    yMax += padding;
  }

  const xScale = (value: number) =>
    PADDING.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (value: number) =>
    PADDING.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

  const xTicks = makeTicks(xMin, xMax);
  const yTicks = makeTicks(yMin, yMax);
  const points = series.points
    .map((point) => `${xScale(point.x)},${yScale(point.y)}`)
    .join(" ");

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.axisHeader}>
        <Text style={styles.axisTitle}>
          {fieldLabel(yField)}{fieldUnit(yField) ? ` (${fieldUnit(yField)})` : ""}
        </Text>
      </View>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          {yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <React.Fragment key={`y-${tick}`}>
                <Line
                  x1={PADDING.left}
                  y1={y}
                  x2={width - PADDING.right}
                  y2={y}
                  stroke="#E3E6EA"
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING.left - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#777"
                  textAnchor="end"
                >
                  {formatValue(tick, yField)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {xTicks.map((tick) => {
            const x = xScale(tick);
            return (
              <React.Fragment key={`x-${tick}`}>
                <Line
                  x1={x}
                  y1={PADDING.top}
                  x2={x}
                  y2={PADDING.top + plotHeight}
                  stroke="#EEF0F2"
                  strokeWidth={1}
                />
                <SvgText
                  x={x}
                  y={CHART_HEIGHT - 19}
                  fontSize="10"
                  fill="#777"
                  textAnchor="middle"
                >
                  {formatValue(tick, xField)}
                </SvgText>
              </React.Fragment>
            );
          })}

          <Line
            x1={PADDING.left}
            y1={PADDING.top + plotHeight}
            x2={width - PADDING.right}
            y2={PADDING.top + plotHeight}
            stroke="#8A8F98"
            strokeWidth={1.2}
          />
          <Line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + plotHeight}
            stroke="#8A8F98"
            strokeWidth={1.2}
          />

          {series.points.length > 1 ? (
            <Polyline
              points={points}
              fill="none"
              stroke="#2563EB"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {series.points.map((point) => (
            <Circle
              key={point.observationId}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={4}
              fill="#2563EB"
            />
          ))}

          <SvgText
            x={width / 2}
            y={CHART_HEIGHT - 3}
            fontSize="11"
            fill="#555"
            textAnchor="middle"
          >
            {fieldLabel(xField)}{fieldUnit(xField) ? ` (${fieldUnit(xField)})` : ""}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  axisHeader: {
    marginBottom: 2,
  },
  axisTitle: {
    fontSize: 12,
    color: "#666",
  },
});

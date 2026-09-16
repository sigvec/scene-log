import { formatDuration, parseDurationInput } from "./duration";

describe("parseDurationInput", () => {
  it("reads dotted timer notation as minutes and seconds", () => {
    expect(parseDurationInput("1.30")).toBe(90_000);
    expect(parseDurationInput("12.45")).toBe(765_000);
  });

  it("reads colon timer notation", () => {
    expect(parseDurationInput("1:30")).toBe(90_000);
    expect(parseDurationInput("01:30.125")).toBe(90_125);
  });

  it("reads plain numbers as seconds", () => {
    expect(parseDurationInput("90")).toBe(90_000);
    expect(parseDurationInput("1.5")).toBe(1_500);
  });

  it("rejects invalid timer seconds", () => {
    expect(parseDurationInput("1.60")).toBeNull();
    expect(parseDurationInput("1:60")).toBeNull();
    expect(parseDurationInput("abc")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats whole seconds as a timer", () => {
    expect(formatDuration(90_000)).toBe("1:30");
    expect(formatDuration(765_000)).toBe("12:45");
  });

  it("preserves milliseconds when present", () => {
    expect(formatDuration(90_125)).toBe("1:30.125");
  });
});

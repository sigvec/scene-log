import { formatDuration, parseDuration } from "./duration";

describe("parseDuration", () => {
  it("reads dotted timer notation as minutes and seconds", () => {
    expect(parseDuration("1.30")).toBe(90_000);
    expect(parseDuration("12.45")).toBe(765_000);
  });

  it("reads colon timer notation", () => {
    expect(parseDuration("1:30")).toBe(90_000);
    expect(parseDuration("01:30.125")).toBe(90_125);
  });

  it("reads plain numbers as seconds", () => {
    expect(parseDuration("90")).toBe(90_000);
    expect(parseDuration("1.5")).toBe(1_500);
  });

  it("rejects invalid timer seconds", () => {
    expect(parseDuration("1.60")).toBeNull();
    expect(parseDuration("1:60")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
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

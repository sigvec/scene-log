const MINUTE_MS = 60_000;
const SECOND_MS = 1_000;

export function parseDuration(text: string): number | null {
  const value = text.trim();

  if (!value) {
    return null;
  }

  // Timer notation: M:SS or M:SS.mmm
  const colonMatch = value.match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?$/);

  if (colonMatch) {
    const minutes = Number(colonMatch[1]);
    const seconds = Number(colonMatch[2]);
    const milliseconds = Number((colonMatch[3] ?? "").padEnd(3, "0") || 0);

    if (seconds >= 60) {
      return null;
    }

    return minutes * MINUTE_MS + seconds * SECOND_MS + milliseconds;
  }

  // Timer-style decimal notation: M.SS
  // Deliberately require exactly two digits after the decimal.
  const dottedMatch = value.match(/^(\d+)\.(\d{2})$/);

  if (dottedMatch) {
    const minutes = Number(dottedMatch[1]);
    const seconds = Number(dottedMatch[2]);

    if (seconds >= 60) {
      return null;
    }

    return minutes * MINUTE_MS + seconds * SECOND_MS;
  }

  // Plain numbers are interpreted as seconds.
  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * SECOND_MS;
  }

  return null;
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "—";
  }

  const totalSeconds = Math.floor(milliseconds / SECOND_MS);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainder = milliseconds % SECOND_MS;

  const base = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (remainder === 0) {
    return base;
  }

  return `${base}.${remainder.toString().padStart(3, "0")}`;
}

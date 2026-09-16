const MINUTE_MS = 60_000;
const SECOND_MS = 1_000;

/**
 * Parse timer-style input into milliseconds.
 *
 * Supported forms:
 *   1.30       -> 1 minute 30 seconds
 *   12.45      -> 12 minutes 45 seconds
 *   1:30       -> 1 minute 30 seconds
 *   1:30.125   -> 1 minute 30.125 seconds
 *   90         -> 90 seconds
 */
export function parseDurationInput(input: string): number | null {
  const text = input.trim();

  if (!text) {
    return null;
  }

  const colonMatch = text.match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
  if (colonMatch) {
    const minutes = Number(colonMatch[1]);
    const seconds = Number(colonMatch[2]);
    const fraction = colonMatch[3] ? Number(`0.${colonMatch[3]}`) : 0;

    if (seconds >= 60) {
      return null;
    }

    const milliseconds = Math.round(
      minutes * MINUTE_MS + seconds * SECOND_MS + fraction * SECOND_MS,
    );

    return Number.isFinite(milliseconds) ? milliseconds : null;
  }

  const timerMatch = text.match(/^(\d+)\.(\d{2})$/);
  if (timerMatch) {
    const minutes = Number(timerMatch[1]);
    const seconds = Number(timerMatch[2]);

    if (seconds >= 60) {
      return null;
    }

    return minutes * MINUTE_MS + seconds * SECOND_MS;
  }

  const seconds = Number(text);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }

  return Math.round(seconds * SECOND_MS);
}

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "—";
  }

  const totalSeconds = milliseconds / SECOND_MS;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const wholeSeconds = Math.floor(seconds);
  const fraction = Math.round((seconds - wholeSeconds) * 1000);

  const secondText = wholeSeconds.toString().padStart(2, "0");
  if (fraction === 0) {
    return `${minutes}:${secondText}`;
  }

  return `${minutes}:${secondText}.${fraction.toString().padStart(3, "0")}`;
}

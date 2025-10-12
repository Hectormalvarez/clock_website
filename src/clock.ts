import { formatTime } from "./utils/time";

interface ClockElements {
  clock: HTMLElement;
  timezone: HTMLElement;
  environmentMarker: HTMLElement;
}

export function createClock(elements: ClockElements) {
  const { clock, timezone, environmentMarker } = elements;

  function update() {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.replace("_", " ");

    clock.textContent = formatTime(now);
    timezone.textContent = timeZone;

    if (import.meta.env.MODE === "development") {
      environmentMarker.textContent = "DEV";
    } else {
      environmentMarker.textContent = "";
    }
  }
  return {
    start: () => {
      update();
      setInterval(update, 1000);
    },
  };
}

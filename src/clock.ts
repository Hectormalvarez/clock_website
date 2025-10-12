import { formatTime } from './utils/time';

interface ClockElements {
  clock: HTMLElement;
  timezone: HTMLElement;
  environmentMarker: HTMLElement;
}

export function createClock(elements: ClockElements) {
  const { clock, timezone, environmentMarker } = elements;
  let lastSecond: number | null = null;

  const formatter = new Intl.DateTimeFormat();
  const timeZone = formatter.resolvedOptions().timeZone.replace('_', ' ');

  function tick() {
    const now = new Date();
    const currentSecond = now.getSeconds();

    if (currentSecond !== lastSecond) {
      lastSecond = currentSecond;

      clock.textContent = formatTime(now);
      timezone.textContent = timeZone;

      if (import.meta.env.MODE === 'development') {
        environmentMarker.textContent = 'DEV';
      } else {
        environmentMarker.textContent = '';
      }
    }

    requestAnimationFrame(tick);
  }

  return {
    start: () => requestAnimationFrame(tick),
  };
}
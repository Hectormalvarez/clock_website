import { formatTime, formatTimeForTitle } from '../utils/time';

interface ClockElements {
  clock: HTMLElement;
  timezone: HTMLElement;
  environmentMarker: HTMLElement;
}

export function createClock(elements: ClockElements) {
  const { clock, timezone, environmentMarker } = elements;
  let lastSecond: number | null = null;
  let lastMinute: number | null = null;
  let intervalId: number | null = null;

  const formatter = new Intl.DateTimeFormat();
  const timeZone = formatter.resolvedOptions().timeZone.replace('_', ' ');

  function tick() {
    const now = new Date();
    const currentSecond = now.getSeconds();
    const currentMinute = now.getMinutes();

    if (currentMinute !== lastMinute) {
      lastMinute = currentMinute;
      // Don't overwrite title when timer is running/paused
      if (!document.body.hasAttribute('data-timer-active')) {
        document.title = `${formatTimeForTitle(now)} | Simple Clock`;
      }
    }

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
  }

  function start() {
    // Sync to the next whole second for a clean first tick
    const now = new Date();
    const msToNextSecond = 1000 - now.getMilliseconds();

    setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }, msToNextSecond);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop };
}
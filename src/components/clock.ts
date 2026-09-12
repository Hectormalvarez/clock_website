import { computeClockTick, msToNextSecond } from '@/features/clock/clock.core';
import { queryOptional } from '@/shared/dom/query';

// ---------- DOM wiring ----------

export function initClock(
	rootElement: HTMLElement,
): { start: () => void; stop: () => void } | null {
	const clockEl = queryOptional<HTMLElement>(rootElement, '.clock');
	const timezoneEl = queryOptional<HTMLElement>(rootElement, '.timezone');
	const envMarkerEl = queryOptional<HTMLElement>(
		document,
		'.environment-marker',
	);

	if (!clockEl || !timezoneEl || !envMarkerEl) {
		console.error('Could not find all required clock elements.');
		return null;
	}

	// Narrow once so the closures below capture non-null bindings.
	const clock = clockEl;
	const timezone = timezoneEl;
	const envMarker = envMarkerEl;

	let lastMinute: number | null = null;
	let lastSecond: number | null = null;
	let intervalId: number | null = null;
	const isDevMode = import.meta.env.MODE === 'development';

	function tick() {
		const now = new Date();
		const result = computeClockTick({
			now,
			lastMinute,
			lastSecond,
			isTimerActive: document.body.hasAttribute('data-timer-active'),
			devMode: isDevMode,
		});

		lastMinute = result.newLastMinute;
		lastSecond = result.newLastSecond;

		if (result.titleText !== null) {
			document.title = result.titleText;
		}

		if (result.timezoneText !== null) {
			timezone.textContent = result.timezoneText;
		}

		clock.textContent = result.clockText;
		envMarker.textContent = result.envMarkerText;
	}

	function start() {
		tick();
		const ms = msToNextSecond(new Date());
		setTimeout(() => {
			tick();
			intervalId = window.setInterval(tick, 1000);
		}, ms);
	}

	function stop() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	return { start, stop };
}

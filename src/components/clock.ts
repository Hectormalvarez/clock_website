import { formatTime, formatTimeForTitle } from '@/shared/time/format';
import { queryOptional } from '@/shared/dom/query';

// ---------- Pure logic (testable without DOM) ----------

export interface ClockTickInput {
	now: Date;
	lastMinute: number | null;
	lastSecond: number | null;
	isTimerActive: boolean;
	devMode: boolean;
}

export interface ClockTickResult {
	clockText: string;
	timezoneText: string | null;
	envMarkerText: string;
	titleText: string | null;
	newLastMinute: number;
	newLastSecond: number;
}

const cachedTimezone = new Intl.DateTimeFormat()
	.resolvedOptions()
	.timeZone.replace('_', ' ');

/**
 * Pure function: given the current state, returns what the clock should display.
 */
export function computeClockTick(input: ClockTickInput): ClockTickResult {
	const { now, lastMinute, lastSecond, isTimerActive, devMode } = input;
	const currentSecond = now.getSeconds();
	const currentMinute = now.getMinutes();

	let titleText: string | null = null;
	let timezoneText: string | null = null;

	if (currentMinute !== lastMinute && !isTimerActive) {
		titleText = `${formatTimeForTitle(now)} | Simple Clock`;
	}

	if (currentSecond !== lastSecond) {
		timezoneText = cachedTimezone;
	}

	return {
		clockText: formatTime(now),
		timezoneText,
		envMarkerText: devMode ? 'DEV' : '',
		titleText,
		newLastMinute: currentMinute,
		newLastSecond: currentSecond,
	};
}

/**
 * Returns milliseconds until the next whole second boundary.
 */
export function msToNextSecond(now: Date): number {
	return 1000 - now.getMilliseconds();
}

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

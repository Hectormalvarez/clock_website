import { formatTime, formatTimeForTitle } from '@/shared/time/format';

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

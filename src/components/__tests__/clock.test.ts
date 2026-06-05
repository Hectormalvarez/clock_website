import { describe, it, expect } from 'vitest';
import { computeClockTick, msToNextSecond } from '../clock';
import type { ClockTickInput } from '../clock';

function fakeDate(h: number, m: number, s: number, ms = 0): Date {
	return new Date(2025, 5, 15, h, m, s, ms);
}

function baseInput(overrides: Partial<ClockTickInput> = {}): ClockTickInput {
	return {
		now: fakeDate(10, 30, 45),
		lastMinute: null,
		lastSecond: null,
		isTimerActive: false,
		devMode: false,
		...overrides,
	};
}

describe('computeClockTick', () => {
	it('returns formatted clock text', () => {
		const result = computeClockTick(baseInput({ now: fakeDate(9, 5, 3) }));
		expect(result.clockText).toBe('9:05:03 AM');
	});

	it('formats PM times correctly', () => {
		const result = computeClockTick(baseInput({ now: fakeDate(14, 30, 0) }));
		expect(result.clockText).toBe('2:30:00 PM');
	});

	it('formats midnight correctly', () => {
		const result = computeClockTick(baseInput({ now: fakeDate(0, 0, 0) }));
		expect(result.clockText).toBe('12:00:00 AM');
	});

	describe('title updates', () => {
		it('updates title when minute changes and timer is not active', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 31, 0),
					lastMinute: 30,
					lastSecond: 59,
					isTimerActive: false,
				}),
			);
			expect(result.titleText).toBe('10:31 AM | Simple Clock');
		});

		it('does not update title when timer is active', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 31, 0),
					lastMinute: 30,
					lastSecond: 59,
					isTimerActive: true,
				}),
			);
			expect(result.titleText).toBeNull();
		});

		it('does not update title when minute has not changed', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 30, 15),
					lastMinute: 30,
					lastSecond: 14,
					isTimerActive: false,
				}),
			);
			expect(result.titleText).toBeNull();
		});

		it('updates title on first tick (lastMinute is null)', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 30, 45),
					lastMinute: null,
					isTimerActive: false,
				}),
			);
			expect(result.titleText).toBe('10:30 AM | Simple Clock');
		});
	});

	describe('timezone updates', () => {
		it('updates timezone when second changes', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 30, 45),
					lastSecond: 44,
				}),
			);
			expect(result.timezoneText).not.toBeNull();
		});

		it('does not update timezone when second has not changed', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 30, 45),
					lastSecond: 45,
				}),
			);
			expect(result.timezoneText).toBeNull();
		});

		it('updates timezone on first tick (lastSecond is null)', () => {
			const result = computeClockTick(
				baseInput({
					now: fakeDate(10, 30, 45),
					lastSecond: null,
				}),
			);
			expect(result.timezoneText).not.toBeNull();
		});
	});

	describe('environment marker', () => {
		it('shows DEV in dev mode', () => {
			const result = computeClockTick(baseInput({ devMode: true }));
			expect(result.envMarkerText).toBe('DEV');
		});

		it('shows empty string in production mode', () => {
			const result = computeClockTick(baseInput({ devMode: false }));
			expect(result.envMarkerText).toBe('');
		});
	});

	describe('state tracking', () => {
		it('returns current minute and second for next tick', () => {
			const result = computeClockTick(baseInput({ now: fakeDate(10, 31, 45) }));
			expect(result.newLastMinute).toBe(31);
			expect(result.newLastSecond).toBe(45);
		});
	});
});

describe('msToNextSecond', () => {
	it('returns 0 when milliseconds is 0', () => {
		expect(msToNextSecond(fakeDate(10, 30, 45, 0))).toBe(1000);
	});

	it('returns 1 when milliseconds is 999', () => {
		expect(msToNextSecond(fakeDate(10, 30, 45, 999))).toBe(1);
	});

	it('returns 500 when milliseconds is 500', () => {
		expect(msToNextSecond(fakeDate(10, 30, 45, 500))).toBe(500);
	});
});

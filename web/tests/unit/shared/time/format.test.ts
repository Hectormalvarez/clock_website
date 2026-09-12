import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	formatTime,
	formatTimeForTitle,
	formatDuration,
	formatFinishTime,
} from '@/shared/time/format';

function fakeDate(
	year: number,
	month: number,
	day: number,
	h: number,
	m: number,
	s: number,
): Date {
	return new Date(year, month - 1, day, h, m, s);
}

describe('formatTime', () => {
	it('formats midnight as 12:00:00 AM', () => {
		expect(formatTime(fakeDate(2025, 1, 1, 0, 0, 0))).toBe('12:00:00 AM');
	});

	it('formats noon as 12:00:00 PM', () => {
		expect(formatTime(fakeDate(2025, 6, 15, 12, 0, 0))).toBe('12:00:00 PM');
	});

	it('formats morning time correctly', () => {
		expect(formatTime(fakeDate(2025, 3, 10, 9, 5, 3))).toBe('9:05:03 AM');
	});

	it('formats evening time correctly', () => {
		expect(formatTime(fakeDate(2025, 12, 31, 23, 59, 59))).toBe('11:59:59 PM');
	});

	it('supports hiding seconds', () => {
		expect(
			formatTime(fakeDate(2025, 1, 1, 14, 30, 45), { showSeconds: false }),
		).toBe('2:30 PM');
	});
});

describe('formatTimeForTitle', () => {
	it('formats midnight without seconds', () => {
		expect(formatTimeForTitle(fakeDate(2025, 1, 1, 0, 0, 0))).toBe('12:00 AM');
	});

	it('formats evening time without seconds', () => {
		expect(formatTimeForTitle(fakeDate(2025, 7, 4, 17, 30, 45))).toBe(
			'5:30 PM',
		);
	});
});

describe('formatDuration', () => {
	it('formats zero seconds as 00:00', () => {
		expect(formatDuration(0)).toBe('00:00');
	});

	it('formats seconds only', () => {
		expect(formatDuration(45)).toBe('00:45');
	});

	it('formats minutes only', () => {
		expect(formatDuration(300)).toBe('05:00');
	});

	it('formats mixed minutes and seconds', () => {
		expect(formatDuration(150)).toBe('02:30');
	});

	it('handles large durations', () => {
		expect(formatDuration(3661)).toBe('61:01');
	});

	it('clamps negative values to 00:00', () => {
		expect(formatDuration(-10)).toBe('00:00');
	});
});

describe('formatFinishTime', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a string matching h:mm:ss AM/PM pattern', () => {
		vi.useFakeTimers();
		vi.setSystemTime(fakeDate(2025, 6, 15, 12, 0, 0));

		const result = formatFinishTime(0);
		// Should be current time formatted
		expect(result).toBe('12:00:00 PM');

		vi.useRealTimers();
	});

	it('formats finish time 60 seconds from now', () => {
		vi.useFakeTimers();
		vi.setSystemTime(fakeDate(2025, 6, 15, 12, 0, 0));

		const result = formatFinishTime(60);
		expect(result).toBe('12:01:00 PM');

		vi.useRealTimers();
	});

	it('wraps across noon', () => {
		vi.useFakeTimers();
		vi.setSystemTime(fakeDate(2025, 6, 15, 11, 59, 50));

		const result = formatFinishTime(15); // 15 seconds later → 12:00:05 PM
		expect(result).toBe('12:00:05 PM');

		vi.useRealTimers();
	});
});

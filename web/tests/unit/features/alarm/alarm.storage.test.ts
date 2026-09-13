import { describe, it, expect, beforeEach } from 'vitest';
import { loadAlarms, saveAlarms } from '@/features/alarm/alarm.storage';
import type { Alarm } from '@/features/alarm/alarm.core';

const KEY = 'test-alarms';

const alarm: Alarm = {
	id: 'alarm-1',
	name: 'Standup',
	hour: 9,
	minute: 30,
	enabled: true,
	snoozedUntil: null,
};

beforeEach(() => {
	localStorage.clear();
});

describe('saveAlarms / loadAlarms', () => {
	it('round-trips alarms through localStorage', () => {
		saveAlarms(KEY, [alarm]);
		expect(loadAlarms(KEY)).toEqual([alarm]);
	});

	it('returns an empty list when the key is missing', () => {
		expect(loadAlarms(KEY)).toEqual([]);
	});

	it('returns an empty list when the stored value is corrupted', () => {
		localStorage.setItem(KEY, '{not json');
		expect(loadAlarms(KEY)).toEqual([]);
	});

	it('overwrites previously stored alarms', () => {
		saveAlarms(KEY, [alarm]);
		saveAlarms(KEY, []);
		expect(loadAlarms(KEY)).toEqual([]);
	});
});

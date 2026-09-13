import { describe, it, expect } from 'vitest';
import {
	createAlarmId,
	parseAlarmTime,
	formatAlarmTime,
	alarmDisplayName,
	parseAlarms,
	createAlarmCore,
	addAlarm,
	removeAlarm,
	setAlarmEnabled,
	tickAlarms,
	snoozeAlarm,
	dismissAlarm,
	SNOOZE_MINUTES,
} from '@/features/alarm/alarm.core';
import type { Alarm, AlarmCore } from '@/features/alarm/alarm.core';

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
	return {
		id: 'alarm-1',
		name: 'Standup',
		hour: 9,
		minute: 30,
		enabled: true,
		snoozedUntil: null,
		...overrides,
	};
}

function makeCore(alarms: Alarm[], ringingId: string | null = null): AlarmCore {
	return { alarms, ringingId };
}

// ---------- IDs ----------

describe('createAlarmId', () => {
	it('follows the alarm-<ts>-<rand> convention', () => {
		expect(createAlarmId()).toMatch(/^alarm-\d+-\d+$/);
	});

	it('produces distinct ids', () => {
		const ids = new Set(Array.from({ length: 20 }, () => createAlarmId()));
		expect(ids.size).toBeGreaterThan(1);
	});
});

// ---------- Input parsing / validation ----------

describe('parseAlarmTime', () => {
	it('parses valid HH:MM values', () => {
		expect(parseAlarmTime('09:30')).toEqual({ hour: 9, minute: 30 });
		expect(parseAlarmTime('23:59')).toEqual({ hour: 23, minute: 59 });
		expect(parseAlarmTime('0:00')).toEqual({ hour: 0, minute: 0 });
	});

	it('rejects empty or malformed values', () => {
		expect(parseAlarmTime('')).toBeNull();
		expect(parseAlarmTime('abc')).toBeNull();
		expect(parseAlarmTime('9')).toBeNull();
		expect(parseAlarmTime('09:3')).toBeNull();
	});

	it('rejects out-of-range values', () => {
		expect(parseAlarmTime('24:00')).toBeNull();
		expect(parseAlarmTime('12:60')).toBeNull();
		expect(parseAlarmTime('-1:30')).toBeNull();
	});
});

describe('formatAlarmTime', () => {
	it('zero-pads both parts', () => {
		expect(formatAlarmTime(9, 30)).toBe('09:30');
		expect(formatAlarmTime(0, 0)).toBe('00:00');
		expect(formatAlarmTime(23, 59)).toBe('23:59');
	});
});

describe('alarmDisplayName', () => {
	it('returns the trimmed name', () => {
		expect(alarmDisplayName(makeAlarm({ name: ' Standup ' }))).toBe('Standup');
	});

	it('defaults a blank name to Alarm', () => {
		expect(alarmDisplayName(makeAlarm({ name: '' }))).toBe('Alarm');
		expect(alarmDisplayName(makeAlarm({ name: '   ' }))).toBe('Alarm');
	});
});

// ---------- Persistence parsing ----------

describe('parseAlarms', () => {
	it('returns an empty list for null/empty input', () => {
		expect(parseAlarms(null)).toEqual([]);
		expect(parseAlarms('')).toEqual([]);
	});

	it('returns an empty list for malformed JSON', () => {
		expect(parseAlarms('{not json')).toEqual([]);
	});

	it('returns an empty list for non-array JSON', () => {
		expect(parseAlarms('{"id": "alarm-1"}')).toEqual([]);
	});

	it('keeps valid alarm entries', () => {
		const json = JSON.stringify([makeAlarm()]);
		expect(parseAlarms(json)).toEqual([makeAlarm()]);
	});

	it('discards malformed entries but keeps valid ones', () => {
		const json = JSON.stringify([
			makeAlarm(),
			{ id: 'alarm-2' },
			makeAlarm({ id: 'alarm-3', hour: 25 }),
			makeAlarm({ id: 'alarm-4', snoozedUntil: 'soon' }),
		]);
		const alarms = parseAlarms(json);
		expect(alarms.map((alarm) => alarm.id)).toEqual(['alarm-1']);
	});
});

// ---------- State machine ----------

describe('addAlarm', () => {
	it('appends a new enabled alarm', () => {
		const core = addAlarm(createAlarmCore(), 'Standup', {
			hour: 9,
			minute: 30,
		});
		expect(core.alarms).toHaveLength(1);
		expect(core.alarms[0]).toMatchObject({
			name: 'Standup',
			hour: 9,
			minute: 30,
			enabled: true,
			snoozedUntil: null,
		});
		expect(core.alarms[0].id).toMatch(/^alarm-/);
		expect(core.ringingId).toBeNull();
	});

	it('does not mutate the previous state', () => {
		const before = createAlarmCore();
		addAlarm(before, 'Standup', { hour: 9, minute: 30 });
		expect(before.alarms).toHaveLength(0);
	});
});

describe('removeAlarm', () => {
	it('removes the alarm by id', () => {
		const core = makeCore([makeAlarm(), makeAlarm({ id: 'alarm-2' })]);
		const next = removeAlarm(core, 'alarm-1');
		expect(next.alarms.map((alarm) => alarm.id)).toEqual(['alarm-2']);
	});

	it('stops ringing when the ringing alarm is removed', () => {
		const core = makeCore([makeAlarm()], 'alarm-1');
		expect(removeAlarm(core, 'alarm-1').ringingId).toBeNull();
	});

	it('keeps ringing when a different alarm is removed', () => {
		const core = makeCore(
			[makeAlarm(), makeAlarm({ id: 'alarm-2' })],
			'alarm-1',
		);
		expect(removeAlarm(core, 'alarm-2').ringingId).toBe('alarm-1');
	});
});

describe('setAlarmEnabled', () => {
	it('disables an alarm', () => {
		const next = setAlarmEnabled(makeCore([makeAlarm()]), 'alarm-1', false);
		expect(next.alarms[0].enabled).toBe(false);
	});

	it('re-enabling clears any pending snooze', () => {
		const core = makeCore([makeAlarm({ enabled: false, snoozedUntil: 5000 })]);
		const next = setAlarmEnabled(core, 'alarm-1', true);
		expect(next.alarms[0].snoozedUntil).toBeNull();
		expect(next.alarms[0].enabled).toBe(true);
	});

	it('disabling also clears any pending snooze', () => {
		const core = makeCore([makeAlarm({ enabled: true, snoozedUntil: 5000 })]);
		const next = setAlarmEnabled(core, 'alarm-1', false);
		expect(next.alarms[0].snoozedUntil).toBeNull();
	});
});

describe('tickAlarms', () => {
	const now = new Date(2026, 8, 13, 9, 30, 30); // just past 09:30

	it('rings an alarm exactly at its time', () => {
		const exact = new Date(2026, 8, 13, 9, 30, 0);
		const result = tickAlarms(makeCore([makeAlarm()]), exact);
		expect(result.rangId).toBe('alarm-1');
	});

	it('does not ring an alarm missed beyond the grace window', () => {
		const late = new Date(2026, 8, 13, 10, 0, 0);
		const result = tickAlarms(makeCore([makeAlarm()]), late);
		expect(result.rangId).toBeNull();
		expect(result.core.alarms[0].enabled).toBe(true);
	});

	it('rings a due enabled alarm and disables it (one-shot)', () => {
		const core = makeCore([makeAlarm({ hour: 9, minute: 30 })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBe('alarm-1');
		expect(result.core.ringingId).toBe('alarm-1');
		expect(result.core.alarms[0].enabled).toBe(false);
	});

	it('does not ring a disabled alarm', () => {
		const core = makeCore([makeAlarm({ enabled: false })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
		expect(result.core).toEqual(core);
	});

	it('does not ring an alarm whose time is still ahead', () => {
		const core = makeCore([makeAlarm({ hour: 10, minute: 30 })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
	});

	it('does not ring an alarm scheduled for a time earlier today twice', () => {
		// After firing, the alarm is disabled, so a later tick (or a reload
		// mid-minute) cannot ring the same occurrence again.
		const fired = makeCore([makeAlarm({ enabled: false })]);
		const result = tickAlarms(fired, now);
		expect(result.rangId).toBeNull();
	});

	it('defers a second due alarm while one is already ringing', () => {
		const core = makeCore(
			[makeAlarm({ hour: 9, minute: 29 }), makeAlarm({ id: 'alarm-2' })],
			'alarm-1',
		);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
		expect(result.core.alarms[1].enabled).toBe(true);
	});

	it('rings a snoozed alarm once its snooze expires', () => {
		const snoozedUntil = now.getTime() - 1;
		const core = makeCore([makeAlarm({ enabled: false, snoozedUntil })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBe('alarm-1');
		expect(result.core.alarms[0].snoozedUntil).toBeNull();
		expect(result.core.alarms[0].enabled).toBe(false);
	});

	it('does not ring a snoozed alarm before its snooze expires', () => {
		const snoozedUntil = now.getTime() + 60_000;
		const core = makeCore([makeAlarm({ enabled: false, snoozedUntil })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
	});
});

describe('snoozeAlarm', () => {
	it('re-arms the alarm SNOOZE_MINUTES from now and stops ringing', () => {
		const now = new Date(2026, 8, 13, 9, 30, 0);
		const core = makeCore([makeAlarm({ enabled: false })], 'alarm-1');
		const next = snoozeAlarm(core, 'alarm-1', now);
		expect(next.ringingId).toBeNull();
		expect(next.alarms[0].snoozedUntil).toBe(
			now.getTime() + SNOOZE_MINUTES * 60_000,
		);
	});
});

describe('dismissAlarm', () => {
	it('stops ringing without changing the alarm', () => {
		const alarm = makeAlarm({ enabled: false });
		const core = makeCore([alarm], 'alarm-1');
		const next = dismissAlarm(core);
		expect(next.ringingId).toBeNull();
		expect(next.alarms[0]).toEqual(alarm);
	});
});

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
		repeat: false,
		lastRungDay: null,
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

// ---------- Daily repeat (US-002) ----------

describe('addAlarm repeat option', () => {
	it('creates a repeat alarm when requested', () => {
		const core = addAlarm(
			createAlarmCore(),
			'Standup',
			{ hour: 9, minute: 30 },
			true,
		);
		expect(core.alarms[0].repeat).toBe(true);
		expect(core.alarms[0].lastRungDay).toBeNull();
	});

	it('defaults to one-shot', () => {
		const core = addAlarm(createAlarmCore(), 'Standup', {
			hour: 9,
			minute: 30,
		});
		expect(core.alarms[0].repeat).toBe(false);
	});
});

describe('daily-repeat alarms', () => {
	const now = new Date(2026, 8, 13, 9, 30, 30); // just past 09:30
	const nextDay = new Date(2026, 8, 14, 9, 30, 30);

	it('rings a repeat alarm without consuming it', () => {
		const core = makeCore([makeAlarm({ repeat: true })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBe('alarm-1');
		expect(result.core.alarms[0].enabled).toBe(true);
		expect(result.core.alarms[0].snoozedUntil).toBeNull();
	});

	it('marks the rung occurrence so it cannot ring twice today', () => {
		const core = makeCore([makeAlarm({ repeat: true })]);
		const first = tickAlarms(core, now);
		expect(first.core.alarms[0].lastRungDay).toBe(now.toDateString());
		// A dismiss mid-grace-window (or a reload) must not re-ring today.
		const again = tickAlarms({ ...first.core, ringingId: null }, now);
		expect(again.rangId).toBeNull();
	});

	it('rings a repeat alarm again the next day', () => {
		const core = makeCore([makeAlarm({ repeat: true })]);
		const first = tickAlarms(core, now);
		const second = tickAlarms({ ...first.core, ringingId: null }, nextDay);
		expect(second.rangId).toBe('alarm-1');
		expect(second.core.alarms[0].enabled).toBe(true);
	});

	it('stays armed after being dismissed', () => {
		const core = makeCore([makeAlarm({ repeat: true })], 'alarm-1');
		const dismissed = dismissAlarm(core);
		expect(dismissed.alarms[0].enabled).toBe(true);
		expect(dismissed.ringingId).toBeNull();
		const result = tickAlarms(dismissed, now);
		expect(result.rangId).toBe('alarm-1');
	});

	it('rings after a snooze expires and stays armed for the next day', () => {
		const snoozeAt = new Date(2026, 8, 13, 9, 30, 0);
		let core = makeCore([makeAlarm({ repeat: true })], 'alarm-1');
		core = snoozeAlarm(core, 'alarm-1', snoozeAt);
		const snoozedUntil = core.alarms[0].snoozedUntil;
		expect(snoozedUntil).not.toBeNull();
		const rang = tickAlarms(
			{ ...core },
			new Date((snoozedUntil as number) + 1),
		);
		expect(rang.rangId).toBe('alarm-1');
		expect(rang.core.alarms[0].enabled).toBe(true);
		expect(rang.core.alarms[0].snoozedUntil).toBeNull();
		const next = tickAlarms({ ...rang.core, ringingId: null }, nextDay);
		expect(next.rangId).toBe('alarm-1');
	});

	it('never rings while disabled', () => {
		const core = makeCore([makeAlarm({ repeat: true, enabled: false })]);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
	});

	it('re-arms from its configured time when toggled (consumed day cleared)', () => {
		let core = makeCore([makeAlarm({ repeat: true })]);
		core = tickAlarms(core, now).core; // rang today
		core = dismissAlarm(core); // overlay closes; alarm still armed
		core = setAlarmEnabled(core, 'alarm-1', false);
		core = setAlarmEnabled(core, 'alarm-1', true);
		expect(core.alarms[0].lastRungDay).toBeNull();
		const result = tickAlarms(core, now);
		expect(result.rangId).toBe('alarm-1');
	});

	it('queues a second due repeat alarm while one is already ringing', () => {
		const core = makeCore(
			[
				makeAlarm({ hour: 9, minute: 29, repeat: true }),
				makeAlarm({ id: 'alarm-2', repeat: true }),
			],
			'alarm-1',
		);
		const result = tickAlarms(core, now);
		expect(result.rangId).toBeNull();
		expect(result.core.alarms[1].enabled).toBe(true);
	});

	it('parses legacy records without a repeat flag as one-shot', () => {
		const json = JSON.stringify([
			{
				id: 'alarm-1',
				name: 'Old',
				hour: 7,
				minute: 0,
				enabled: true,
				snoozedUntil: null,
			},
		]);
		const alarms = parseAlarms(json);
		expect(alarms[0].repeat).toBe(false);
		expect(alarms[0].lastRungDay).toBeNull();
		// One-shot semantics intact: rings, then disables itself.
		const late = new Date(2026, 8, 13, 7, 0, 30);
		const result = tickAlarms(makeCore(alarms), late);
		expect(result.rangId).toBe('alarm-1');
		expect(result.core.alarms[0].enabled).toBe(false);
	});

	it('round-trips the repeat flag and rejects a non-boolean one', () => {
		const json = JSON.stringify([makeAlarm({ repeat: true })]);
		expect(parseAlarms(json)).toEqual([makeAlarm({ repeat: true })]);
		const bad = JSON.stringify([{ ...makeAlarm(), repeat: 'yes' }]);
		expect(parseAlarms(bad)).toEqual([]);
	});
});

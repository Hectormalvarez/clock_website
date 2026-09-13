/**
 * Pure alarm state machine.
 *
 * Every function takes state in and returns new state out — zero DOM, zero
 * side effects. Fully unit-testable. The current time is always passed in by
 * the caller (`now`), so tick behaviour is deterministic in tests.
 */

// ---------- Types ----------

export interface Alarm {
	id: string;
	/** User label; empty string means the default display name. */
	name: string;
	hour: number;
	minute: number;
	enabled: boolean;
	/** Epoch ms when a snoozed alarm re-arms; `null` when not snoozed. */
	snoozedUntil: number | null;
}

export interface AlarmCore {
	alarms: Alarm[];
	/** The alarm currently ringing, if any. One overlay at a time. */
	ringingId: string | null;
}

export interface AlarmTime {
	hour: number;
	minute: number;
}

/** Fixed snooze duration (story MVP decision). */
export const SNOOZE_MINUTES = 9;

const SNOOZE_MS = SNOOZE_MINUTES * 60 * 1000;

// ---------- IDs ----------

/** New unique alarm id. Follows the clock-registry id convention. */
export function createAlarmId(): string {
	return `alarm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ---------- Input parsing / validation ----------

/**
 * Parse an `HH:MM` value as produced by an `<input type="time">`.
 * Returns `null` for anything that is not a valid 24-hour time.
 */
export function parseAlarmTime(value: string): AlarmTime | null {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
	if (!match) return null;
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	if (hour > 23 || minute > 59) return null;
	return { hour, minute };
}

/** Format a time as zero-padded `HH:MM`. */
export function formatAlarmTime(hour: number, minute: number): string {
	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Display name for an alarm; blank names default to "Alarm". */
export function alarmDisplayName(alarm: Alarm): string {
	return alarm.name.trim() || 'Alarm';
}

// ---------- Persistence parsing ----------

function isAlarm(value: unknown): value is Alarm {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === 'string' &&
		typeof candidate.name === 'string' &&
		typeof candidate.hour === 'number' &&
		Number.isInteger(candidate.hour) &&
		candidate.hour >= 0 &&
		candidate.hour <= 23 &&
		typeof candidate.minute === 'number' &&
		Number.isInteger(candidate.minute) &&
		candidate.minute >= 0 &&
		candidate.minute <= 59 &&
		typeof candidate.enabled === 'boolean' &&
		(candidate.snoozedUntil === null ||
			typeof candidate.snoozedUntil === 'number')
	);
}

/** Parse persisted JSON into alarms; malformed data is discarded. */
export function parseAlarms(json: string | null): Alarm[] {
	if (!json) return [];
	try {
		const parsed: unknown = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isAlarm);
	} catch {
		return [];
	}
}

// ---------- State machine ----------

/** Create the initial alarm core state, optionally from saved alarms. */
export function createAlarmCore(alarms?: Alarm[]): AlarmCore {
	return { alarms: alarms ?? [], ringingId: null };
}

/** Add a new alarm, enabled by default. */
export function addAlarm(
	core: AlarmCore,
	name: string,
	time: AlarmTime,
): AlarmCore {
	const alarm: Alarm = {
		id: createAlarmId(),
		name,
		hour: time.hour,
		minute: time.minute,
		enabled: true,
		snoozedUntil: null,
	};
	return { ...core, alarms: [...core.alarms, alarm] };
}

/** Delete an alarm by id; cancels ringing if it was the one ringing. */
export function removeAlarm(core: AlarmCore, id: string): AlarmCore {
	return {
		alarms: core.alarms.filter((alarm) => alarm.id !== id),
		ringingId: core.ringingId === id ? null : core.ringingId,
	};
}

/**
 * Enable or disable an alarm.
 *
 * Either transition clears any pending snooze: an alarm that is toggled by
 * hand is re-armed from its configured time, not from an old snooze.
 */
export function setAlarmEnabled(
	core: AlarmCore,
	id: string,
	enabled: boolean,
): AlarmCore {
	return {
		...core,
		alarms: core.alarms.map((alarm) =>
			alarm.id === id ? { ...alarm, enabled, snoozedUntil: null } : alarm,
		),
	};
}

/** Epoch ms of today's `HH:MM` (may be in the past or the future). */
function todayAt(hour: number, minute: number, now: Date): number {
	const candidate = new Date(now);
	candidate.setHours(hour, minute, 0, 0);
	return candidate.getTime();
}

/**
 * How long after the target minute a late tick still rings the alarm.
 *
 * Ticks land just past the second boundary and background tabs may tick as
 * rarely as once a minute, so the ring window spans the whole target minute.
 * A time that is already in the past by more than this window stays silent
 * until its next occurrence (tomorrow) — see AC-6.
 */
const RING_GRACE_MS = 60 * 1000;

function isDue(alarm: Alarm, now: Date): boolean {
	// A snoozed alarm rings by its snooze timestamp regardless of `enabled`:
	// firing disabled it, and snoozing is the only thing that re-arms it.
	if (alarm.snoozedUntil !== null) {
		return now.getTime() >= alarm.snoozedUntil;
	}
	if (!alarm.enabled) return false;
	const delta = now.getTime() - todayAt(alarm.hour, alarm.minute, now);
	return delta >= 0 && delta < RING_GRACE_MS;
}

export interface AlarmTickResult {
	core: AlarmCore;
	/** The alarm that started ringing on this tick, if any. */
	rangId: string | null;
}

/**
 * Advance the alarm scheduler by one tick.
 *
 * The first due alarm starts ringing; it is disabled (one-shot) so the same
 * occurrence can never ring twice, including across a page reload. When
 * something is already ringing, due alarms stay armed and ring on a later
 * tick — the overlay handles one alarm at a time.
 */
export function tickAlarms(core: AlarmCore, now: Date): AlarmTickResult {
	if (core.ringingId !== null) {
		return { core, rangId: null };
	}
	for (const alarm of core.alarms) {
		if (!isDue(alarm, now)) continue;
		return {
			core: {
				alarms: core.alarms.map((a) =>
					a.id === alarm.id ? { ...a, enabled: false, snoozedUntil: null } : a,
				),
				ringingId: alarm.id,
			},
			rangId: alarm.id,
		};
	}
	return { core, rangId: null };
}

/** Snooze the given alarm; it re-arms `SNOOZE_MINUTES` from `now`. */
export function snoozeAlarm(core: AlarmCore, id: string, now: Date): AlarmCore {
	return {
		...core,
		ringingId: null,
		alarms: core.alarms.map((alarm) =>
			alarm.id === id
				? { ...alarm, snoozedUntil: now.getTime() + SNOOZE_MS }
				: alarm,
		),
	};
}

/** Stop ringing (dismiss). The alarm stays disabled. */
export function dismissAlarm(core: AlarmCore): AlarmCore {
	return { ...core, ringingId: null };
}

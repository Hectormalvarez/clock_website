import { describe, it, expect } from 'vitest';
import {
	parseInputSeconds,
	clampInputs,
	secondsToInputs,
	hasValidInput,
	decInputs,
	incInputs,
	parsePresets,
	formatPresetLabel,
	addPreset,
	removePreset,
	createTimerCore,
	canStart,
	startTimer,
	pauseTimer,
	resetTimer,
	tickTimer,
	applyPreset,
	addUserPreset,
	removeUserPreset,
	titlePrefix,
	isResetVisible,
	isPresetsHidden,
	isInputsEnabled,
	isAddBtnInactive,
	DEFAULT_PRESETS,
	DEFAULT_DURATION,
} from '../timer-core';
import type { TimerCore } from '../timer-core';

function makeCore(overrides: Partial<TimerCore> = {}): TimerCore {
	return { ...createTimerCore(), ...overrides };
}

// ---------- Input helpers ----------

describe('parseInputSeconds', () => {
	it('parses valid inputs', () => {
		expect(parseInputSeconds('5', '0')).toBe(300);
		expect(parseInputSeconds('0', '30')).toBe(30);
		expect(parseInputSeconds('10', '45')).toBe(645);
	});

	it('handles empty/NaN inputs as 0', () => {
		expect(parseInputSeconds('', '')).toBe(0);
		expect(parseInputSeconds('abc', 'xyz')).toBe(0);
	});

	it('clamps values to max ranges', () => {
		expect(parseInputSeconds('99', '59')).toBe(99 * 60 + 59);
		expect(parseInputSeconds('100', '60')).toBe(99 * 60 + 59);
	});
});

describe('clampInputs', () => {
	it('clamps to valid ranges', () => {
		expect(clampInputs(-1, -1)).toEqual({ mins: 0, secs: 0 });
		expect(clampInputs(100, 60)).toEqual({ mins: 99, secs: 59 });
	});

	it('passes through valid values', () => {
		expect(clampInputs(5, 30)).toEqual({ mins: 5, secs: 30 });
	});
});

describe('secondsToInputs', () => {
	it('converts 0 to 0:0', () => {
		expect(secondsToInputs(0)).toEqual({ mins: 0, secs: 0 });
	});

	it('converts 300 to 5:0', () => {
		expect(secondsToInputs(300)).toEqual({ mins: 5, secs: 0 });
	});

	it('converts 90 to 1:30', () => {
		expect(secondsToInputs(90)).toEqual({ mins: 1, secs: 30 });
	});
});

describe('hasValidInput', () => {
	it('returns true for positive values', () => {
		expect(hasValidInput('1', '0')).toBe(true);
		expect(hasValidInput('0', '1')).toBe(true);
	});

	it('returns false for zero', () => {
		expect(hasValidInput('0', '0')).toBe(false);
	});
});

// ---------- Inc / Dec ----------

describe('decInputs', () => {
	it('decrements minutes when activeInput is min', () => {
		expect(decInputs(5, 0, 'min')).toEqual({ mins: 4, secs: 0 });
	});

	it('does not go below 0 minutes', () => {
		expect(decInputs(0, 0, 'min')).toEqual({ mins: 0, secs: 0 });
	});

	it('decrements seconds by 15s steps', () => {
		expect(decInputs(5, 30, 'sec')).toEqual({ mins: 5, secs: 15 });
		expect(decInputs(5, 15, 'sec')).toEqual({ mins: 5, secs: 0 });
	});

	it('wraps from 0s to 45s and decrements minute', () => {
		expect(decInputs(5, 0, 'sec')).toEqual({ mins: 4, secs: 45 });
	});

	it('does not wrap below 0 minutes', () => {
		expect(decInputs(0, 0, 'sec')).toEqual({ mins: 0, secs: 0 });
	});
});

describe('incInputs', () => {
	it('increments minutes when activeInput is min', () => {
		expect(incInputs(5, 0, 'min')).toEqual({ mins: 6, secs: 0 });
	});

	it('does not go above 99 minutes', () => {
		expect(incInputs(99, 0, 'min')).toEqual({ mins: 99, secs: 0 });
	});

	it('increments seconds by 15s steps', () => {
		expect(incInputs(5, 0, 'sec')).toEqual({ mins: 5, secs: 15 });
		expect(incInputs(5, 15, 'sec')).toEqual({ mins: 5, secs: 30 });
	});

	it('wraps from 45s to 0s and increments minute', () => {
		expect(incInputs(5, 45, 'sec')).toEqual({ mins: 6, secs: 0 });
	});

	it('does not wrap above 99 minutes', () => {
		expect(incInputs(99, 45, 'sec')).toEqual({ mins: 99, secs: 0 });
	});
});

// ---------- Preset helpers ----------

describe('parsePresets', () => {
	it('returns defaults for null', () => {
		expect(parsePresets(null)).toEqual(DEFAULT_PRESETS);
	});

	it('returns defaults for invalid JSON', () => {
		expect(parsePresets('not json')).toEqual(DEFAULT_PRESETS);
	});

	it('returns defaults for non-array', () => {
		expect(parsePresets('{"foo": 1}')).toEqual(DEFAULT_PRESETS);
	});

	it('returns defaults for array with non-numbers', () => {
		expect(parsePresets('[1, "a", 3]')).toEqual(DEFAULT_PRESETS);
	});

	it('returns defaults for array with negative numbers', () => {
		expect(parsePresets('[1, -5, 3]')).toEqual(DEFAULT_PRESETS);
	});

	it('parses valid preset arrays', () => {
		expect(parsePresets('[60, 300, 900]')).toEqual([60, 300, 900]);
	});
});

describe('formatPresetLabel', () => {
	it('formats whole minutes', () => {
		expect(formatPresetLabel(300)).toBe('5m');
		expect(formatPresetLabel(60)).toBe('1m');
	});

	it('formats minutes with seconds', () => {
		expect(formatPresetLabel(90)).toBe('1m 30s');
		expect(formatPresetLabel(330)).toBe('5m 30s');
	});
});

describe('addPreset', () => {
	it('adds a new preset', () => {
		expect(addPreset([300, 900], 1500)).toEqual([300, 900, 1500]);
	});

	it('sorts presets after adding', () => {
		expect(addPreset([900], 300)).toEqual([300, 900]);
	});

	it('does not add duplicates', () => {
		expect(addPreset([300, 900], 300)).toEqual([300, 900]);
	});

	it('does not add zero or negative', () => {
		expect(addPreset([300], 0)).toEqual([300]);
		expect(addPreset([300], -1)).toEqual([300]);
	});

	it('respects max limit', () => {
		const presets = [1, 2, 3];
		expect(addPreset(presets, 4, 3)).toEqual([1, 2, 3]);
	});
});

describe('removePreset', () => {
	it('removes by index', () => {
		expect(removePreset([300, 900, 1500], 1)).toEqual([300, 1500]);
	});

	it('does not mutate original array', () => {
		const original = [300, 900];
		removePreset(original, 0);
		expect(original).toEqual([300, 900]);
	});
});

// ---------- State machine ----------

describe('createTimerCore', () => {
	it('creates with default values', () => {
		const core = createTimerCore();
		expect(core.state).toBe('idle');
		expect(core.remaining).toBe(DEFAULT_DURATION);
		expect(core.configuredDuration).toBe(DEFAULT_DURATION);
		expect(core.presets).toEqual(DEFAULT_PRESETS);
	});

	it('accepts custom presets', () => {
		const core = createTimerCore([60, 120]);
		expect(core.presets).toEqual([60, 120]);
	});
});

describe('canStart', () => {
	it('returns true for idle, paused, finished', () => {
		expect(canStart(makeCore({ state: 'idle' }))).toBe(true);
		expect(canStart(makeCore({ state: 'paused' }))).toBe(true);
		expect(canStart(makeCore({ state: 'finished' }))).toBe(true);
	});

	it('returns false for running', () => {
		expect(canStart(makeCore({ state: 'running' }))).toBe(false);
	});
});

describe('startTimer', () => {
	const now = new Date(2025, 5, 15, 12, 0, 0);

	it('transitions idle → running', () => {
		const result = startTimer(makeCore({ remaining: 300 }), now);
		expect(result).not.toBeNull();
		expect(result!.state).toBe('running');
		expect(result!.finishTimestamp).toBe(now.getTime() + 300000);
	});

	it('transitions paused → running (resume)', () => {
		const result = startTimer(
			makeCore({ state: 'paused', remaining: 120 }),
			now,
		);
		expect(result!.state).toBe('running');
		expect(result!.remaining).toBe(120);
	});

	it('does nothing if already running', () => {
		const result = startTimer(
			makeCore({ state: 'running', remaining: 100 }),
			now,
		);
		expect(result).toBeNull();
	});

	it('returns null if remaining is 0 from idle', () => {
		const result = startTimer(makeCore({ state: 'idle', remaining: 0 }), now);
		expect(result).toBeNull();
	});
});

describe('pauseTimer', () => {
	it('transitions running → paused', () => {
		const startTime = new Date(2025, 5, 15, 12, 0, 0);
		const core = startTimer(makeCore({ remaining: 300 }), startTime)!;
		// Simulate 10 seconds passing
		const pauseTime = new Date(2025, 5, 15, 12, 0, 10);
		const result = pauseTimer(core, pauseTime);
		expect(result).not.toBeNull();
		expect(result!.state).toBe('paused');
		expect(result!.remaining).toBe(290);
		expect(result!.finishTimestamp).toBeNull();
	});

	it('does nothing if not running', () => {
		expect(pauseTimer(makeCore({ state: 'idle' }))).toBeNull();
		expect(pauseTimer(makeCore({ state: 'paused' }))).toBeNull();
		expect(pauseTimer(makeCore({ state: 'finished' }))).toBeNull();
	});
});

describe('resetTimer', () => {
	it('returns to idle with configured duration', () => {
		const core = makeCore({
			configuredDuration: 600,
			remaining: 100,
			state: 'running',
		});
		const result = resetTimer(core);
		expect(result.state).toBe('idle');
		expect(result.remaining).toBe(600);
		expect(result.finishTimestamp).toBeNull();
	});
});

describe('tickTimer', () => {
	it('decrements remaining while running', () => {
		const core = makeCore({ state: 'running', remaining: 300 });
		const result = tickTimer(core);
		expect(result.remaining).toBe(299);
		expect(result.state).toBe('running');
	});

	it('transitions to finished when remaining hits 0', () => {
		const core = makeCore({ state: 'running', remaining: 1 });
		const result = tickTimer(core);
		expect(result.state).toBe('finished');
		expect(result.remaining).toBe(0);
		expect(result.finishTimestamp).toBeNull();
	});

	it('does nothing if not running', () => {
		const core = makeCore({ state: 'idle', remaining: 300 });
		expect(tickTimer(core)).toEqual(core);
	});
});

describe('applyPreset', () => {
	it('sets duration and remaining from preset', () => {
		const result = applyPreset(makeCore(), 900);
		expect(result.configuredDuration).toBe(900);
		expect(result.remaining).toBe(900);
	});

	it('does nothing while running', () => {
		const core = makeCore({ state: 'running' });
		expect(applyPreset(core, 900)).toEqual(core);
	});

	it('transitions paused to idle', () => {
		const result = applyPreset(makeCore({ state: 'paused' }), 900);
		expect(result.state).toBe('idle');
	});
});

describe('addUserPreset / removeUserPreset', () => {
	it('adds a preset to the core', () => {
		const core = addUserPreset(makeCore(), 120);
		expect(core.presets).toContain(120);
	});

	it('removes a preset by index', () => {
		const core = removeUserPreset(makeCore(), 0);
		expect(core.presets.length).toBe(DEFAULT_PRESETS.length - 1);
	});
});

// ---------- Derived display values ----------

describe('titlePrefix', () => {
	it('returns empty for idle', () => {
		expect(titlePrefix('idle', 300)).toBe('');
	});

	it('returns empty for finished', () => {
		expect(titlePrefix('finished', 0)).toBe('');
	});

	it('returns formatted prefix for running', () => {
		expect(titlePrefix('running', 300)).toBe('05:00 | ');
	});

	it('returns formatted prefix for paused', () => {
		expect(titlePrefix('paused', 65)).toBe('01:05 | ');
	});
});

describe('isResetVisible', () => {
	it('is false for idle', () => {
		expect(isResetVisible('idle')).toBe(false);
	});

	it('is true for all other states', () => {
		expect(isResetVisible('running')).toBe(true);
		expect(isResetVisible('paused')).toBe(true);
		expect(isResetVisible('finished')).toBe(true);
	});
});

describe('isPresetsHidden', () => {
	it('is true for running and paused', () => {
		expect(isPresetsHidden('running')).toBe(true);
		expect(isPresetsHidden('paused')).toBe(true);
	});

	it('is false for idle and finished', () => {
		expect(isPresetsHidden('idle')).toBe(false);
		expect(isPresetsHidden('finished')).toBe(false);
	});
});

describe('isInputsEnabled', () => {
	it('is true for idle and finished', () => {
		expect(isInputsEnabled('idle')).toBe(true);
		expect(isInputsEnabled('finished')).toBe(true);
	});

	it('is false for running and paused', () => {
		expect(isInputsEnabled('running')).toBe(false);
		expect(isInputsEnabled('paused')).toBe(false);
	});
});

describe('isAddBtnInactive', () => {
	it('is true when total is 0', () => {
		expect(isAddBtnInactive([300], 0)).toBe(true);
	});

	it('is true when preset already exists', () => {
		expect(isAddBtnInactive([300, 900], 300)).toBe(true);
	});

	it('is false when valid and unique', () => {
		expect(isAddBtnInactive([300, 900], 150)).toBe(false);
	});
});

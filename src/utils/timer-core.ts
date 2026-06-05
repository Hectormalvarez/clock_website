/**
 * Pure timer state machine.
 *
 * Every function takes state in and returns new state out —
 * zero DOM, zero side effects. Fully unit-testable.
 */

// ---------- Types ----------

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerCore {
  state: TimerState;
  remaining: number;
  configuredDuration: number;
  finishTimestamp: number | null;
  presets: number[];
}

export const DEFAULT_DURATION = 5 * 60; // 5 minutes
export const MAX_PRESETS = 10;
export const DEFAULT_PRESETS = [300, 900, 1500]; // 5m, 15m, 25m

// ---------- Input helpers ----------

/** Parse min/sec string inputs into total seconds, clamped to valid ranges. */
export function parseInputSeconds(mins: string, secs: string): number {
  const m = parseInt(mins, 10) || 0;
  const s = parseInt(secs, 10) || 0;
  return Math.min(m, 99) * 60 + Math.min(s, 59);
}

/** Clamp raw min/sec numbers to valid ranges. */
export function clampInputs(mins: number, secs: number): { mins: number; secs: number } {
  return {
    mins: Math.max(0, Math.min(mins, 99)),
    secs: Math.max(0, Math.min(secs, 59)),
  };
}

/** Convert total seconds to { mins, secs } for display in inputs. */
export function secondsToInputs(totalSec: number): { mins: number; secs: number } {
  return {
    mins: Math.floor(totalSec / 60),
    secs: totalSec % 60,
  };
}

/** Check if the parsed input is greater than zero. */
export function hasValidInput(mins: string, secs: string): boolean {
  return parseInputSeconds(mins, secs) > 0;
}

// ---------- Inc / Dec ----------

/** Decrement seconds by 15-second steps, wrapping across minutes. */
export function decInputs(mins: number, secs: number, activeInput: 'min' | 'sec'): { mins: number; secs: number } {
  if (activeInput === 'sec') {
    const raw = Math.ceil(secs / 15) * 15 - 15;
    if (raw < 0) {
      return {
        mins: mins > 0 ? mins - 1 : mins,
        secs: mins > 0 ? 45 : 0,
      };
    }
    return { mins, secs: raw };
  }
  return { mins: mins > 0 ? mins - 1 : mins, secs };
}

/** Increment seconds by 15-second steps, wrapping across minutes. */
export function incInputs(mins: number, secs: number, activeInput: 'min' | 'sec'): { mins: number; secs: number } {
  if (activeInput === 'sec') {
    const raw = Math.floor(secs / 15) * 15 + 15;
    if (raw > 59) {
      return {
        mins: mins < 99 ? mins + 1 : mins,
        secs: 0,
      };
    }
    return { mins, secs: raw };
  }
  return { mins: mins < 99 ? mins + 1 : mins, secs };
}

// ---------- Preset helpers ----------

/** Attempt to parse presets from a raw localStorage value. Returns defaults on failure. */
export function parsePresets(raw: string | null): number[] {
  if (!raw) return [...DEFAULT_PRESETS];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n: unknown) => typeof n === 'number' && n > 0)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_PRESETS];
}

/** Format a preset duration into a human label like "5m" or "15m 30s". */
export function formatPresetLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/** Add a preset if it's valid, not a duplicate, and within limit. Returns new array. */
export function addPreset(presets: number[], seconds: number, max = MAX_PRESETS): number[] {
  if (seconds <= 0) return presets;
  if (presets.includes(seconds)) return presets;
  if (presets.length >= max) return presets;
  return [...presets, seconds].sort((a, b) => a - b);
}

/** Remove a preset by index. Returns new array. */
export function removePreset(presets: number[], index: number): number[] {
  return presets.filter((_, i) => i !== index);
}

// ---------- State machine ----------

/** Create the initial timer core state. */
export function createTimerCore(presets?: number[]): TimerCore {
  return {
    state: 'idle',
    remaining: DEFAULT_DURATION,
    configuredDuration: DEFAULT_DURATION,
    finishTimestamp: null,
    presets: presets ?? [...DEFAULT_PRESETS],
  };
}

/** Can the timer be started from the current state? */
export function canStart(core: TimerCore): boolean {
  return core.state === 'idle' || core.state === 'paused' || core.state === 'finished';
}

/** Transition to running. Returns new state or null if invalid. */
export function startTimer(core: TimerCore, now: Date = new Date()): TimerCore | null {
  if (core.state === 'running') return null;
  if (core.state === 'idle' || core.state === 'finished') {
    if (core.remaining <= 0) return null;
  }
  return {
    ...core,
    state: 'running',
    finishTimestamp: now.getTime() + core.remaining * 1000,
  };
}

/** Transition to paused. Returns new state or null if invalid. */
export function pauseTimer(core: TimerCore, now: Date = new Date()): TimerCore | null {
  if (core.state !== 'running') return null;
  if (core.finishTimestamp === null) return null;
  const remaining = Math.max(0, Math.ceil((core.finishTimestamp - now.getTime()) / 1000));
  return {
    ...core,
    state: 'paused',
    remaining,
    finishTimestamp: null,
  };
}

/** Transition to idle (reset). Returns new state. */
export function resetTimer(core: TimerCore): TimerCore {
  return {
    ...core,
    state: 'idle',
    remaining: core.configuredDuration,
    finishTimestamp: null,
  };
}

/** Tick the countdown. Returns new state (may be 'finished'). */
export function tickTimer(core: TimerCore): TimerCore {
  if (core.state !== 'running') return core;
  const remaining = core.remaining - 1;
  if (remaining <= 0) {
    return {
      ...core,
      state: 'finished',
      remaining: 0,
      finishTimestamp: null,
    };
  }
  return { ...core, remaining };
}

/** Apply a preset duration. Returns new state. */
export function applyPreset(core: TimerCore, seconds: number): TimerCore {
  if (core.state === 'running') return core;
  return {
    ...core,
    state: core.state === 'paused' ? 'idle' : core.state,
    configuredDuration: seconds,
    remaining: seconds,
    finishTimestamp: null,
  };
}

/** Add a user-defined preset. Returns new core with updated presets. */
export function addUserPreset(core: TimerCore, seconds: number): TimerCore {
  return {
    ...core,
    presets: addPreset(core.presets, seconds),
  };
}

/** Remove a preset by index. Returns new core with updated presets. */
export function removeUserPreset(core: TimerCore, index: number): TimerCore {
  return {
    ...core,
    presets: removePreset(core.presets, index),
  };
}

// ---------- Derived display values ----------

/** Compute the document title prefix. */
export function titlePrefix(state: TimerState, remaining: number): string {
  if (state === 'idle' || state === 'finished') return '';
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} | `;
}

/** Determine if the reset button should be visible. */
export function isResetVisible(state: TimerState): boolean {
  return state !== 'idle';
}

/** Determine if presets should be hidden. */
export function isPresetsHidden(state: TimerState): boolean {
  return state === 'running' || state === 'paused';
}

/** Determine if inputs should be enabled. */
export function isInputsEnabled(state: TimerState): boolean {
  return state !== 'running' && state !== 'paused';
}

/** Determine the add-preset button disabled state. */
export function isAddBtnInactive(presets: number[], totalSeconds: number): boolean {
  return totalSeconds <= 0 || presets.includes(totalSeconds);
}
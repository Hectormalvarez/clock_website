/**
 * Preset helpers for the timer feature.
 *
 * Pure functions over plain `number[]` — no DOM, no storage, no state machine.
 */

export const MAX_PRESETS = 10;
export const DEFAULT_PRESETS = [300, 900, 1500]; // 5m, 15m, 25m

/** Attempt to parse presets from a raw localStorage value. Returns defaults on failure. */
export function parsePresets(raw: string | null): number[] {
	if (!raw) return [...DEFAULT_PRESETS];
	try {
		const parsed = JSON.parse(raw);
		if (
			Array.isArray(parsed) &&
			parsed.every((n: unknown) => typeof n === 'number' && n > 0)
		) {
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
export function addPreset(
	presets: number[],
	seconds: number,
	max = MAX_PRESETS,
): number[] {
	if (seconds <= 0) return presets;
	if (presets.includes(seconds)) return presets;
	if (presets.length >= max) return presets;
	return [...presets, seconds].sort((a, b) => a - b);
}

/** Remove a preset by index. Returns new array. */
export function removePreset(presets: number[], index: number): number[] {
	return presets.filter((_, i) => i !== index);
}

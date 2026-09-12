/**
 * localStorage adapter for timer presets.
 *
 * Keeps `window.localStorage` access in one place so the UI layer stays free
 * of storage concerns and the persistence strategy can be swapped without
 * touching the UI.
 */

import { parsePresets } from './timer.presets';

/** Load presets stored under `key`, falling back to the defaults. */
export function loadPresets(key: string): number[] {
	return parsePresets(localStorage.getItem(key));
}

/** Persist `presets` under `key`. */
export function savePresets(key: string, presets: number[]): void {
	localStorage.setItem(key, JSON.stringify(presets));
}

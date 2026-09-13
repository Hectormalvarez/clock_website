/**
 * localStorage adapter for alarms.
 *
 * Keeps `window.localStorage` access in one place so the UI layer stays free
 * of storage concerns and the persistence strategy can be swapped without
 * touching the UI.
 */

import { parseAlarms } from './alarm.core';
import type { Alarm } from './alarm.core';

/** Load alarms stored under `key`, falling back to an empty list. */
export function loadAlarms(key: string): Alarm[] {
	return parseAlarms(localStorage.getItem(key));
}

/** Persist `alarms` under `key`. */
export function saveAlarms(key: string, alarms: Alarm[]): void {
	localStorage.setItem(key, JSON.stringify(alarms));
}

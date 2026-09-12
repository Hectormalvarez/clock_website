import { initClock } from '@/features/clock';
import { initTimer } from '@/features/timer';
import { TIMER_STORAGE_KEY } from './config';

/**
 * Composition root: wires the feature modules into the static page.
 *
 * Called exactly once from `main.ts`. Each feature degrades gracefully when
 * its container is absent, so the entry point stays a one-liner.
 */
export function bootstrap(): void {
	const clockContainer = document.getElementById('clock-container');
	if (clockContainer) {
		initClock(clockContainer)?.start();
	}

	const timerWrapper = document.getElementById('timer-wrapper');
	if (timerWrapper) {
		initTimer(timerWrapper, { storageKey: TIMER_STORAGE_KEY });
	}
}

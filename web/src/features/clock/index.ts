/**
 * Public surface of the clock feature.
 *
 * Consumers should import from `@/features/clock` rather than reaching into
 * the individual `clock.core` / `clock.ui` modules.
 */
export { computeClockTick, msToNextSecond } from './clock.core';
export type { ClockTickInput, ClockTickResult } from './clock.core';
export { initClock } from './clock.ui';
export type { ClockInstance } from './clock.ui';

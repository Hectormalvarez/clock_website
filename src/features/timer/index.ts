/**
 * Public surface of the timer feature.
 *
 * Consumers should import from `@/features/timer` rather than reaching into
 * the individual `timer.core` / `timer.presets` / `timer.storage` / `timer.ui`
 * modules.
 */
export { initTimer } from './timer.ui';
export type { TimerConfig, TimerInstance } from './timer.ui';
export type { TimerCore, TimerState } from './timer.core';

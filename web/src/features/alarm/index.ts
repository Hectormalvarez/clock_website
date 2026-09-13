/**
 * Public surface of the alarm feature.
 *
 * Consumers should import from `@/features/alarm` rather than reaching into
 * the individual `alarm.core` / `alarm.storage` / `alarm.ui` modules.
 */
export { initAlarm } from './alarm.ui';
export type { AlarmConfig, AlarmInstance } from './alarm.ui';
export type { Alarm, AlarmCore, AlarmTime } from './alarm.core';
export { SNOOZE_MINUTES } from './alarm.core';

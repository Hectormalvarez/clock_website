/**
 * Build-time application configuration.
 *
 * Vite injects `import.meta.env`, so this module is the single place the app
 * reads environment-derived values. Keeping them here keeps `import.meta` out
 * of the feature modules and makes the values easy to stub in tests.
 */

/** The active Vite mode (`development`, `production`, ...). */
export const APP_ENV: string = import.meta.env.MODE;

/** True when the bundle is being served by the Vite dev server. */
export const IS_DEV = APP_ENV === 'development';

/** localStorage key holding the main timer's saved presets. */
export const TIMER_STORAGE_KEY = 'main-timer-presets';

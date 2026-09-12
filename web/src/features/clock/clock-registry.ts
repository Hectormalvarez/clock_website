/**
 * Multi-clock registry scaffolding.
 *
 * NOTE: not wired into the app yet - `initClock` renders a single clock
 * today. Kept under the feature so multi-clock work has a home.
 */
export interface ClockConfig {
	id: string;
	timezone: string;
	defaultCity: string;
	nickname: string;
	showSeconds: boolean;
}

export interface ClockState {
	clocks: ClockConfig[];
	activeIndex: number;
}

export function getLocalTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function parseCityFromTimezone(tz: string): string {
	return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
}

export function createDefaultClock(): ClockConfig {
	const tz = getLocalTimezone();
	return {
		id: `clock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
		timezone: tz,
		defaultCity: parseCityFromTimezone(tz),
		nickname: '',
		showSeconds: true,
	};
}

export function createInitialState(savedClocks?: ClockConfig[]): ClockState {
	if (savedClocks && savedClocks.length > 0) {
		return { clocks: savedClocks, activeIndex: 0 };
	}
	return { clocks: [createDefaultClock()], activeIndex: 0 };
}

export function addClock(state: ClockState, timezone: string): ClockState {
	const newClock: ClockConfig = {
		id: `clock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
		timezone,
		defaultCity: parseCityFromTimezone(timezone),
		nickname: '',
		showSeconds: false, // Secondary clocks default to no seconds
	};
	return {
		clocks: [...state.clocks, newClock],
		activeIndex: state.clocks.length, // Auto-focus the new clock
	};
}

export function updateClock(
	state: ClockState,
	index: number,
	updates: Partial<ClockConfig>,
): ClockState {
	const newClocks = [...state.clocks];
	newClocks[index] = { ...newClocks[index], ...updates };
	return { ...state, clocks: newClocks };
}

export function removeClock(state: ClockState, index: number): ClockState {
	if (state.clocks.length <= 1) return state; // Prevent removing the last clock
	const newClocks = state.clocks.filter((_, i) => i !== index);
	let newIndex = state.activeIndex;
	if (newIndex >= newClocks.length) newIndex = newClocks.length - 1;
	else if (index < newIndex) newIndex--;

	return { clocks: newClocks, activeIndex: newIndex };
}

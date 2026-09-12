import { formatDuration, formatFinishTime } from '@/shared/time/format';
import { playBeep } from '@/shared/audio/beep';
import { queryOptional } from '@/shared/dom/query';
import {
	createTimerCore,
	startTimer,
	pauseTimer,
	resetTimer,
	tickTimer,
	applyPreset,
	addUserPreset,
	removeUserPreset,
	parseInputSeconds,
	secondsToInputs,
	hasValidInput,
	decInputs,
	incInputs,
	isResetVisible,
	isPresetsHidden,
	isInputsEnabled,
	isAddBtnInactive,
} from '@/features/timer/timer.core';
import { formatPresetLabel } from '@/features/timer/timer.presets';
import { loadPresets, savePresets } from '@/features/timer/timer.storage';
import type { TimerState } from '@/features/timer/timer.core';

export type { TimerState };

export interface TimerConfig {
	onStateChange?: (state: TimerState) => void;
	storageKey?: string;
}

export function initTimer(rootElement: HTMLElement, config: TimerConfig = {}) {
	// ---------- DOM lookups (with type narrowing guard) ----------

	const display = queryOptional<HTMLElement>(rootElement, '.timer-display');
	const finishTimeEl = queryOptional<HTMLElement>(
		rootElement,
		'.timer-finish-time',
	);
	const minInput = queryOptional<HTMLInputElement>(rootElement, '.timer-min');
	const secInput = queryOptional<HTMLInputElement>(rootElement, '.timer-sec');
	const startBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-start',
	);
	const resetBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-reset',
	);
	const decMinBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-dec-min',
	);
	const incMinBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-inc-min',
	);
	const toggleBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-toggle',
	);
	const panel = queryOptional<HTMLElement>(rootElement, '.timer-panel');
	const presetsContainer = queryOptional<HTMLElement>(
		rootElement,
		'.timer-presets',
	);
	const presetsBar = queryOptional<HTMLElement>(
		rootElement,
		'.timer-presets-bar',
	);
	const presetAddBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.timer-preset-add',
	);

	if (
		!display ||
		!finishTimeEl ||
		!minInput ||
		!secInput ||
		!startBtn ||
		!resetBtn ||
		!decMinBtn ||
		!incMinBtn ||
		!toggleBtn ||
		!panel ||
		!presetsContainer ||
		!presetsBar ||
		!presetAddBtn
	) {
		console.error('Could not find all required timer elements.');
		return;
	}

	// Narrow to non-null
	const dom = {
		display,
		finishTimeEl,
		minInput,
		secInput,
		startBtn,
		resetBtn,
		decMinBtn,
		incMinBtn,
		toggleBtn,
		panel,
		presetsContainer,
		presetsBar,
		presetAddBtn,
	};

	// ---------- Core state ----------

	const storageKey = config.storageKey ?? 'timer-presets';
	const presets = loadPresets(storageKey);
	let core = createTimerCore(presets);
	let intervalId: number | null = null;
	let beepIntervalId: number | null = null;
	let isPanelOpen = false;
	let activeInput: 'min' | 'sec' = 'min';

	let sharedAudioCtx: AudioContext | null = null;

	function getAudioCtx() {
		if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
			sharedAudioCtx = new AudioContext();
		}
		return sharedAudioCtx;
	}

	// ---------- Persistence ----------

	function persistPresets() {
		savePresets(storageKey, core.presets);
	}

	// ---------- Render ----------

	function render() {
		const {
			display,
			finishTimeEl,
			startBtn,
			resetBtn,
			minInput,
			secInput,
			decMinBtn,
			incMinBtn,
			presetsContainer,
			presetsBar,
			presetAddBtn,
		} = dom;

		display.textContent = formatDuration(core.remaining);

		// Finish time
		if (
			core.state === 'running' &&
			core.remaining > 0 &&
			core.finishTimestamp !== null
		) {
			finishTimeEl.textContent = `→ ${formatFinishTime(core.remaining)}`;
			finishTimeEl.classList.add('visible');
		} else {
			finishTimeEl.textContent = '';
			finishTimeEl.classList.remove('visible');
		}

		// Toggle button
		renderToggle();

		// Title
		document.title = `${core.state === 'idle' || core.state === 'finished' ? '' : formatDuration(core.remaining) + ' | '}Simple Clock`;

		// Body attribute
		const isActive = core.state !== 'idle' && core.state !== 'finished';
		document.body.toggleAttribute('data-timer-active', isActive);

		// Buttons
		startBtn.textContent =
			core.state === 'running'
				? '⏸ Pause'
				: core.state === 'paused'
					? '▶ Resume'
					: '▶ Start';
		resetBtn.style.display = isResetVisible(core.state) ? '' : 'none';

		// Inputs
		const inputsEnabled = isInputsEnabled(core.state);
		minInput.disabled = !inputsEnabled;
		secInput.disabled = !inputsEnabled;
		decMinBtn.disabled = !inputsEnabled;
		incMinBtn.disabled = !inputsEnabled;

		// Presets visibility
		const hidePresets = isPresetsHidden(core.state);
		presetsContainer.style.display = hidePresets ? 'none' : '';
		decMinBtn.style.display = hidePresets ? 'none' : '';
		incMinBtn.style.display = hidePresets ? 'none' : '';

		// Add button
		if (!hidePresets) {
			const total = parseInputSeconds(minInput.value, secInput.value);
			if (core.presets.length >= 10) {
				presetsBar.style.display = 'none';
			} else {
				presetsBar.style.display = '';
				presetAddBtn.classList.toggle(
					'inactive',
					isAddBtnInactive(core.presets, total),
				);
			}
		} else {
			presetsBar.style.display = 'none';
		}
	}

	function renderToggle() {
		const { toggleBtn } = dom;
		if (isPanelOpen) {
			toggleBtn.textContent = '⏱';
		} else if (
			core.state === 'running' &&
			core.remaining > 0 &&
			core.finishTimestamp !== null
		) {
			toggleBtn.textContent = formatFinishTime(core.remaining);
		} else if (core.state !== 'idle') {
			toggleBtn.textContent = formatDuration(core.remaining);
		} else {
			toggleBtn.textContent = '⏱';
		}
	}

	function setInputsFromSeconds(totalSec: number) {
		const { mins, secs } = secondsToInputs(totalSec);
		dom.minInput.value = String(mins);
		dom.secInput.value = String(secs);
	}

	function renderPresets() {
		const { presetsContainer } = dom;
		presetsContainer.innerHTML = '';
		core.presets.forEach((seconds, index) => {
			const row = document.createElement('div');
			row.className = 'preset-row';
			row.addEventListener('click', () => {
				core = applyPreset(core, seconds);
				setInputsFromSeconds(core.remaining);
				render();
			});

			const label = document.createElement('span');
			label.className = 'preset-row-label';
			label.textContent = formatPresetLabel(seconds);

			const removeBtn = document.createElement('button');
			removeBtn.className = 'preset-row-remove';
			removeBtn.textContent = '×';
			removeBtn.title = 'Remove preset';
			removeBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				core = removeUserPreset(core, index);
				persistPresets();
				renderPresets();
				render();
			});

			row.appendChild(label);
			row.appendChild(removeBtn);
			presetsContainer.appendChild(row);
		});
	}

	// ---------- Core timer actions ----------

	function runCountdown() {
		intervalId = window.setInterval(() => {
			core = tickTimer(core);
			render();

			if (core.state === 'finished') {
				if (intervalId !== null) {
					clearInterval(intervalId);
					intervalId = null;
				}
				document.body.classList.add('timer-finished');
				playBeep(getAudioCtx());
				let beepCount = 0;
				beepIntervalId = window.setInterval(() => {
					playBeep(getAudioCtx());
					beepCount++;
					if (beepCount >= 2) {
						if (beepIntervalId !== null) {
							clearInterval(beepIntervalId);
							beepIntervalId = null;
						}
					}
				}, 700);
			}
		}, 1000);
	}

	function msToNextSecond(): number {
		return 1000 - new Date().getMilliseconds();
	}

	function onStart() {
		if (core.state === 'running') {
			if (intervalId === null) return;
			clearInterval(intervalId);
			intervalId = null;
			core = pauseTimer(core)!;
			render();
			return;
		}

		if (core.state === 'idle' || core.state === 'finished') {
			if (!hasValidInput(dom.minInput.value, dom.secInput.value)) return;
			const duration = parseInputSeconds(
				dom.minInput.value,
				dom.secInput.value,
			);
			core = { ...core, remaining: duration, configuredDuration: duration };
		}

		const next = startTimer(core);
		if (!next) return;
		core = next;
		render();

		setTimeout(() => {
			if (core.state !== 'running') return;
			runCountdown();
		}, msToNextSecond());
	}

	function onReset() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (beepIntervalId !== null) {
			clearInterval(beepIntervalId);
			beepIntervalId = null;
		}
		core = resetTimer(core);
		setInputsFromSeconds(core.configuredDuration);
		document.body.classList.remove('timer-finished');
		render();
	}

	function onDec() {
		const mins = parseInt(dom.minInput.value, 10) || 0;
		const secs = parseInt(dom.secInput.value, 10) || 0;
		const result = decInputs(mins, secs, activeInput);
		dom.minInput.value = String(result.mins);
		dom.secInput.value = String(result.secs);
		render();
	}

	function onInc() {
		const mins = parseInt(dom.minInput.value, 10) || 0;
		const secs = parseInt(dom.secInput.value, 10) || 0;
		const result = incInputs(mins, secs, activeInput);
		dom.minInput.value = String(result.mins);
		dom.secInput.value = String(result.secs);
		render();
	}

	function onAddPreset() {
		const seconds = parseInputSeconds(dom.minInput.value, dom.secInput.value);
		core = addUserPreset(core, seconds);
		persistPresets();
		renderPresets();
		render();
	}

	// ---------- Panel toggle ----------

	// FLIP animation: smoothly animate #clock-container movement when the
	// panel is added/removed (which re-centers the container in the body).
	// The clock sliding up/down IS the open/close animation for the
	// surrounding layout, so open and close feel symmetric.
	function flipAnimateClockContainer(action: () => void) {
		const container = rootElement.closest(
			'#clock-container',
		) as HTMLElement | null;
		if (!container) {
			action();
			return;
		}

		// Lock body overflow so the page can't scroll while the height changes
		const prevBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		// First: record the current position of #clock-container
		const firstRect = container.getBoundingClientRect();

		// Run the DOM mutation (open/close panel)
		action();

		// Last: measure the new position synchronously
		const lastRect = container.getBoundingClientRect();

		// Compute the delta and invert it with a transform
		const dx = firstRect.left - lastRect.left;
		const dy = firstRect.top - lastRect.top;
		if (dx === 0 && dy === 0) {
			document.body.style.overflow = prevBodyOverflow;
			return;
		}

		container.style.transition = 'none';
		container.style.transform = `translate(${dx}px, ${dy}px)`;

		// Play: on the next frame, animate the transform back to identity
		requestAnimationFrame(() => {
			container.style.transition = 'transform 0.3s ease-out';
			container.style.transform = '';
		});

		// Clean up inline styles after the transition completes
		const onEnd = () => {
			container.removeEventListener('transitionend', onEnd);
			container.style.transition = '';
			container.style.transform = '';
			document.body.style.overflow = prevBodyOverflow;
		};
		container.addEventListener('transitionend', onEnd);

		// Fallback in case transitionend doesn't fire
		setTimeout(onEnd, 400);
	}

	function openPanel() {
		flipAnimateClockContainer(() => {
			isPanelOpen = true;
			dom.panel.removeAttribute('hidden');
			dom.toggleBtn.classList.add('active');
			renderToggle();
		});
	}

	function closePanel() {
		// Mirror open exactly: hide the panel immediately and let the FLIP
		// clock slide-up be the close animation. This avoids the lag of
		// waiting for a separate CSS close animation on the panel.
		flipAnimateClockContainer(() => {
			isPanelOpen = false;
			dom.toggleBtn.classList.remove('active');
			dom.panel.classList.remove('closing');
			dom.panel.setAttribute('hidden', '');
			// If the timer had just finished, auto-reset it on close so the
			// next time the panel opens, it's ready to start a new countdown
			// at the configured duration (and silences any in-flight beeps).
			if (core.state === 'finished') {
				onReset();
			} else {
				renderToggle();
			}
		});
	}

	function togglePanel() {
		if (isPanelOpen) closePanel();
		else openPanel();
	}

	function onDocumentClick(e: MouseEvent) {
		const target = e.target as Node;
		if (isPanelOpen && rootElement && !rootElement.contains(target)) {
			closePanel();
		}
	}

	function onDocumentKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isPanelOpen) closePanel();
	}

	// ---------- Init ----------

	function init() {
		setInputsFromSeconds(core.configuredDuration);
		render();
		renderPresets();
		renderToggle();

		dom.toggleBtn.addEventListener('click', togglePanel);
		dom.startBtn.addEventListener('click', onStart);
		dom.resetBtn.addEventListener('click', onReset);
		dom.decMinBtn.addEventListener('click', onDec);
		dom.incMinBtn.addEventListener('click', onInc);
		dom.minInput.addEventListener('focus', () => {
			activeInput = 'min';
			dom.minInput.select();
		});
		dom.secInput.addEventListener('focus', () => {
			activeInput = 'sec';
			dom.secInput.select();
		});
		dom.minInput.addEventListener('change', () => render());
		dom.secInput.addEventListener('change', () => render());
		dom.minInput.addEventListener('input', () => render());
		dom.secInput.addEventListener('input', () => render());
		dom.presetAddBtn.addEventListener('click', onAddPreset);
		document.addEventListener('click', onDocumentClick);
		document.addEventListener('keydown', onDocumentKeydown);
	}

	function destroy() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (beepIntervalId !== null) {
			clearInterval(beepIntervalId);
			beepIntervalId = null;
		}
		if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
			sharedAudioCtx.close().catch(console.error);
		}
		document.removeEventListener('click', onDocumentClick);
		document.removeEventListener('keydown', onDocumentKeydown);
	}

	init();

	return {
		start: onStart,
		pause: () => {
			if (core.state === 'running') {
				if (intervalId !== null) {
					clearInterval(intervalId);
					intervalId = null;
				}
				core = pauseTimer(core)!;
				render();
			}
		},
		reset: onReset,
		destroy,
		togglePanel,
		getState: () => core.state,
	};
}

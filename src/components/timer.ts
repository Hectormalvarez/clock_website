import { formatDuration } from '../utils/time';
import { playBeep } from '../utils/audio';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerElements {
  display: HTMLElement;
  minInput: HTMLInputElement;
  secInput: HTMLInputElement;
  startBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  decMinBtn: HTMLButtonElement;
  incSecBtn: HTMLButtonElement;
  toggleBtn: HTMLButtonElement;
  panel: HTMLElement;
}

export interface TimerCallbacks {
  onStateChange?: (state: TimerState) => void;
}

export function createTimer(elements: TimerElements, callbacks: TimerCallbacks = {}) {
  const {
    display,
    minInput,
    secInput,
    startBtn,
    resetBtn,
    decMinBtn,
    incSecBtn,
    toggleBtn,
    panel,
  } = elements;

  // Internal state
  let state: TimerState = 'idle';
  /** Total remaining seconds in the countdown */
  let remaining = 0;
  /** Last configured duration in seconds (for reset) */
  let configuredDuration = 5 * 60; // default 5:00
  let intervalId: number | null = null;
  let isPanelOpen = false;

  // ---------- Helpers ----------

  function setState(newState: TimerState) {
    state = newState;
    updateTitle();
    callbacks.onStateChange?.(newState);
  }

  function updateTitle() {
    const prefix = state === 'idle' || state === 'finished' ? '' : `${formatDuration(remaining)} | `;
    document.title = `${prefix}Simple Clock`;
  }

  function getInputSeconds(): number {
    const mins = parseInt(minInput.value, 10) || 0;
    const secs = parseInt(secInput.value, 10) || 0;
    return Math.min(mins, 99) * 60 + Math.min(secs, 59);
  }

  function setInputsFromSeconds(totalSec: number) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    minInput.value = String(mins);
    secInput.value = String(secs);
  }

  function updateDisplay() {
    display.textContent = formatDuration(remaining);
    updateToggleContent();
    updateTitle();
  }

  function enableInputs(enabled: boolean) {
    minInput.disabled = !enabled;
    secInput.disabled = !enabled;
    decMinBtn.disabled = !enabled;
    incSecBtn.disabled = !enabled;
  }

  // ---------- UI button handlers ----------

  function onDecMin() {
    const mins = parseInt(minInput.value, 10) || 0;
    if (mins > 0) {
      minInput.value = String(mins - 1);
    }
  }

  function onIncSec() {
    const secs = parseInt(secInput.value, 10) || 0;
    if (secs < 59) {
      secInput.value = String(secs + 1);
    }
  }

  function validateInputs(): boolean {
    const mins = parseInt(minInput.value, 10) || 0;
    const secs = parseInt(secInput.value, 10) || 0;
    if (mins < 0) minInput.value = '0';
    if (secs < 0) secInput.value = '0';
    if (mins > 99) minInput.value = '99';
    if (secs > 59) secInput.value = '59';
    const total = Math.min(mins, 99) * 60 + Math.min(secs, 59);
    return total > 0;
  }

  // ---------- Core timer actions ----------

  function runCountdown() {
    intervalId = window.setInterval(() => {
      remaining--;
      updateDisplay();

      if (remaining <= 0) {
        finish();
      }
    }, 1000);
  }

  function msToNextSecond(): number {
    return 1000 - new Date().getMilliseconds();
  }

  function start() {
    if (state === 'running') return;

    if (state === 'idle' || state === 'finished') {
      if (!validateInputs()) {
        return; // can't start with 00:00
      }
      configuredDuration = getInputSeconds();
      remaining = configuredDuration;
    }

    // If paused, remaining is already set
    setState('running');
    enableInputs(false);
    startBtn.textContent = '⏸ Pause';
    updateDisplay();

    // Sync first tick with the clock's next whole second boundary
    setTimeout(() => {
      if (state !== 'running') return; // was paused/reset during delay
      runCountdown();
    }, msToNextSecond());
  }

  function pause() {
    if (state !== 'running' || intervalId === null) return;
    clearInterval(intervalId);
    intervalId = null;
    setState('paused');
    startBtn.textContent = '▶ Resume';
  }

  function reset() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    setState('idle');
    remaining = configuredDuration;
    setInputsFromSeconds(configuredDuration);
    enableInputs(true);
    startBtn.textContent = '▶ Start';
    updateDisplay();

    // Remove finished flash
    document.body.classList.remove('timer-finished');
  }

  function finish() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    remaining = 0;
    updateDisplay();
    setState('finished');
    startBtn.textContent = '▶ Start';
    enableInputs(true);

    // Flash effect
    document.body.classList.add('timer-finished');

    // Beep
    playBeep();

    // Keep beeping 3 more times every 0.7s
    let beepCount = 0;
    const beepInterval = window.setInterval(() => {
      playBeep();
      beepCount++;
      if (beepCount >= 2) {
        clearInterval(beepInterval);
      }
    }, 700);
  }

  function handleStartPause() {
    if (state === 'running') {
      pause();
    } else {
      start();
    }
  }

  // ---------- Panel toggle ----------

  function updateToggleContent() {
    if (isPanelOpen) {
      toggleBtn.textContent = '⏱';
    } else if (state !== 'idle') {
      toggleBtn.textContent = formatDuration(remaining);
    } else {
      toggleBtn.textContent = '⏱';
    }
  }

  function openPanel() {
    isPanelOpen = true;
    panel.removeAttribute('hidden');
    toggleBtn.classList.add('active');
    updateToggleContent();
  }

  function closePanel() {
    isPanelOpen = false;
    panel.setAttribute('hidden', '');
    toggleBtn.classList.remove('active');
    updateToggleContent();
  }

  function togglePanel() {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function onDocumentClick(e: MouseEvent) {
    const target = e.target as Node;
    const wrapper = document.getElementById('timer-wrapper');
    if (isPanelOpen && wrapper && !wrapper.contains(target)) {
      closePanel();
    }
  }

  function onDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isPanelOpen) {
      closePanel();
    }
  }

  // ---------- Lifecycle ----------

  function init() {
    // Set default display
    remaining = configuredDuration;
    setInputsFromSeconds(configuredDuration);
    updateDisplay();
    enableInputs(true);

    // Wire events
    toggleBtn.addEventListener('click', togglePanel);
    startBtn.addEventListener('click', handleStartPause);
    resetBtn.addEventListener('click', reset);
    decMinBtn.addEventListener('click', onDecMin);
    incSecBtn.addEventListener('click', onIncSec);
    minInput.addEventListener('change', validateInputs);
    secInput.addEventListener('change', validateInputs);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    // Close panel initially
    closePanel();
    updateToggleContent();
  }

  function destroy() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }

  init();

  return { start, pause, reset, destroy, togglePanel, getState: () => state };
}
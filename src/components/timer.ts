import { formatDuration } from '../utils/time';
import { playBeep } from '../utils/audio';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

const STORAGE_KEY = 'timer-presets';
const MAX_PRESETS = 10;

export interface TimerElements {
  display: HTMLElement;
  minInput: HTMLInputElement;
  secInput: HTMLInputElement;
  startBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  decMinBtn: HTMLButtonElement;
  incMinBtn: HTMLButtonElement;
  toggleBtn: HTMLButtonElement;
  panel: HTMLElement;
  presetsContainer: HTMLElement;
  presetsBar: HTMLElement;
  presetAddBtn: HTMLButtonElement;
}

export interface TimerCallbacks {
  onStateChange?: (state: TimerState) => void;
}

function loadPresets(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((n: unknown) => typeof n === 'number' && n > 0)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [300, 900, 1500]; // 5m, 15m, 25m defaults
}

function savePresets(presets: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function formatPresetLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function createTimer(elements: TimerElements, callbacks: TimerCallbacks = {}) {
  const {
    display,
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
  } = elements;

  // Internal state
  let state: TimerState = 'idle';
  /** Total remaining seconds in the countdown */
  let remaining = 0;
  /** Last configured duration in seconds (for reset) */
  let configuredDuration = 5 * 60; // default 5:00
  let intervalId: number | null = null;
  let isPanelOpen = false;
  let presets: number[] = loadPresets();
  let activeInput: 'min' | 'sec' = 'min';

  // ---------- Helpers ----------

  function setState(newState: TimerState) {
    const wasActive = state !== 'idle' && state !== 'finished';
    state = newState;
    const isActive = state !== 'idle' && state !== 'finished';
    if (isActive !== wasActive) {
      document.body.toggleAttribute('data-timer-active', isActive);
    }
    updateResetBtnVisibility();
    updatePresetsVisibility();
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
    incMinBtn.disabled = !enabled;
  }

  function updateResetBtnVisibility() {
    resetBtn.style.display = state === 'idle' ? 'none' : '';
  }

  function updatePresetsVisibility() {
    const hide = state === 'running' || state === 'paused';
    presetsContainer.style.display = hide ? 'none' : '';
    decMinBtn.style.display = hide ? 'none' : '';
    incMinBtn.style.display = hide ? 'none' : '';
    if (!hide) {
      updateAddBtnState();
    } else {
      presetsBar.style.display = 'none';
    }
  }

  // ---------- Preset rendering ----------

  function renderPresets() {
    presetsContainer.innerHTML = '';
    presets.forEach((seconds, index) => {
      const row = document.createElement('div');
      row.className = 'preset-row';
      row.addEventListener('click', () => applyPreset(seconds));

      const label = document.createElement('span');
      label.className = 'preset-row-label';
      label.textContent = formatPresetLabel(seconds);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'preset-row-remove';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove preset';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removePreset(index);
      });

      row.appendChild(label);
      row.appendChild(removeBtn);
      presetsContainer.appendChild(row);
    });
  }

  function updateAddBtnState() {
    const seconds = getInputSeconds();
    if (presets.length >= MAX_PRESETS) {
      presetsBar.style.display = 'none';
    } else {
      presetsBar.style.display = '';
      if (seconds <= 0 || presets.includes(seconds)) {
        presetAddBtn.classList.add('inactive');
      } else {
        presetAddBtn.classList.remove('inactive');
      }
    }
  }

  function applyPreset(seconds: number) {
    if (state === 'running') return; // don't change while running

    // If paused, reset the timer first so we start fresh
    if (state === 'paused') {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      setState('idle');
      enableInputs(true);
      startBtn.textContent = '▶ Start';
      document.body.classList.remove('timer-finished');
    }

    configuredDuration = seconds;
    remaining = seconds;
    setInputsFromSeconds(seconds);
    updateDisplay();
    updateAddBtnState();
  }

  function addPreset() {
    const seconds = getInputSeconds();
    if (seconds <= 0) return;
    // Don't add duplicates
    if (presets.includes(seconds)) return;
    if (presets.length >= MAX_PRESETS) return;
    presets.push(seconds);
    presets.sort((a, b) => a - b);
    savePresets(presets);
    renderPresets();
    updateAddBtnState();
  }

  function removePreset(index: number) {
    presets.splice(index, 1);
    savePresets(presets);
    renderPresets();
    updateAddBtnState();
  }

  // ---------- UI button handlers ----------

  function onDec() {
    if (activeInput === 'sec') {
      let secs = parseInt(secInput.value, 10) || 0;
      let mins = parseInt(minInput.value, 10) || 0;
      const raw = Math.ceil(secs / 15) * 15 - 15;
      if (raw < 0) {
        // Wrapped below 0 (e.g. 0 → -15) → 45, decrement minute
        secs = 45;
        if (mins > 0) mins--;
        else secs = 0;
      } else {
        secs = raw;
      }
      secInput.value = String(secs);
      minInput.value = String(mins);
    } else {
      const mins = parseInt(minInput.value, 10) || 0;
      if (mins > 0) {
        minInput.value = String(mins - 1);
      }
    }
    updateAddBtnState();
  }

  function onInc() {
    if (activeInput === 'sec') {
      let secs = parseInt(secInput.value, 10) || 0;
      let mins = parseInt(minInput.value, 10) || 0;
      const raw = Math.floor(secs / 15) * 15 + 15;
      if (raw > 59) {
        // Wrapped past 59 (e.g. 59 → 60) → 0, increment minute
        secs = 0;
        if (mins < 99) mins++;
      } else {
        secs = raw;
      }
      secInput.value = String(secs);
      minInput.value = String(mins);
    } else {
      const mins = parseInt(minInput.value, 10) || 0;
      if (mins < 99) {
        minInput.value = String(mins + 1);
      }
    }
    updateAddBtnState();
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
    updateResetBtnVisibility();
    updatePresetsVisibility();
    renderPresets();

    // Wire events
    toggleBtn.addEventListener('click', togglePanel);
    startBtn.addEventListener('click', handleStartPause);
    resetBtn.addEventListener('click', reset);
    decMinBtn.addEventListener('click', onDec);
    incMinBtn.addEventListener('click', onInc);
    minInput.addEventListener('focus', () => { activeInput = 'min'; minInput.select(); });
    secInput.addEventListener('focus', () => { activeInput = 'sec'; secInput.select(); });
    minInput.addEventListener('change', () => { validateInputs(); updateAddBtnState(); });
    secInput.addEventListener('change', () => { validateInputs(); updateAddBtnState(); });
    minInput.addEventListener('input', updateAddBtnState);
    secInput.addEventListener('input', updateAddBtnState);
    presetAddBtn.addEventListener('click', addPreset);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    updateAddBtnState();

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
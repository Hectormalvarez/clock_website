import { formatDuration, formatFinishTime } from '../utils/time';
import { playBeep } from '../utils/audio';
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
  parsePresets,
  formatPresetLabel,
  isResetVisible,
  isPresetsHidden,
  isInputsEnabled,
  isAddBtnInactive,
} from '../utils/timer-core';
import type { TimerState } from '../utils/timer-core';

export type { TimerState };

export interface TimerCallbacks {
  onStateChange?: (state: TimerState) => void;
}

const STORAGE_KEY = 'timer-presets';

export function initTimer(callbacks: TimerCallbacks = {}) {
  // ---------- DOM lookups (with type narrowing guard) ----------

  const display = document.getElementById('timer-display');
  const finishTimeEl = document.getElementById('timer-finish-time');
  const minInput = document.getElementById('timer-min') as HTMLInputElement | null;
  const secInput = document.getElementById('timer-sec') as HTMLInputElement | null;
  const startBtn = document.getElementById('timer-start') as HTMLButtonElement | null;
  const resetBtn = document.getElementById('timer-reset') as HTMLButtonElement | null;
  const decMinBtn = document.getElementById('timer-dec-min') as HTMLButtonElement | null;
  const incMinBtn = document.getElementById('timer-inc-min') as HTMLButtonElement | null;
  const toggleBtn = document.getElementById('timer-toggle') as HTMLButtonElement | null;
  const panel = document.getElementById('timer-panel');
  const presetsContainer = document.getElementById('timer-presets');
  const presetsBar = document.getElementById('timer-presets-bar');
  const presetAddBtn = document.getElementById('timer-preset-add') as HTMLButtonElement | null;

  if (!display || !finishTimeEl || !minInput || !secInput || !startBtn || !resetBtn || !decMinBtn || !incMinBtn || !toggleBtn || !panel || !presetsContainer || !presetsBar || !presetAddBtn) {
    console.error('Could not find all required timer elements.');
    return;
  }

  // Narrow to non-null
  const dom = {
    display, finishTimeEl, minInput, secInput, startBtn, resetBtn,
    decMinBtn, incMinBtn, toggleBtn, panel, presetsContainer, presetsBar, presetAddBtn,
  };

  // ---------- Core state ----------

  const presets = parsePresets(localStorage.getItem(STORAGE_KEY));
  let core = createTimerCore(presets);
  let intervalId: number | null = null;
  let isPanelOpen = false;
  let activeInput: 'min' | 'sec' = 'min';

  // ---------- Persistence ----------

  function savePresets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(core.presets));
  }

  // ---------- Render ----------

  function render() {
    const { display, finishTimeEl, startBtn, resetBtn, minInput, secInput, decMinBtn, incMinBtn, presetsContainer, presetsBar, presetAddBtn, toggleBtn } = dom;

    display.textContent = formatDuration(core.remaining);

    // Finish time
    if (core.state === 'running' && core.remaining > 0 && core.finishTimestamp !== null) {
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
    startBtn.textContent = core.state === 'running' ? '⏸ Pause' : core.state === 'paused' ? '▶ Resume' : '▶ Start';
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
        presetAddBtn.classList.toggle('inactive', isAddBtnInactive(core.presets, total));
      }
    } else {
      presetsBar.style.display = 'none';
    }
  }

  function renderToggle() {
    const { toggleBtn } = dom;
    if (isPanelOpen) {
      toggleBtn.textContent = '⏱';
    } else if (core.state === 'running' && core.remaining > 0 && core.finishTimestamp !== null) {
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
        savePresets();
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
        playBeep();
        let beepCount = 0;
        const beepInterval = window.setInterval(() => {
          playBeep();
          beepCount++;
          if (beepCount >= 2) {
            clearInterval(beepInterval);
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
      const duration = parseInputSeconds(dom.minInput.value, dom.secInput.value);
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
    savePresets();
    renderPresets();
    render();
  }

  // ---------- Panel toggle ----------

  function openPanel() {
    isPanelOpen = true;
    dom.panel.removeAttribute('hidden');
    dom.toggleBtn.classList.add('active');
    renderToggle();
  }

  function closePanel() {
    isPanelOpen = false;
    dom.panel.setAttribute('hidden', '');
    dom.toggleBtn.classList.remove('active');
    renderToggle();
  }

  function togglePanel() {
    if (isPanelOpen) closePanel();
    else openPanel();
  }

  function onDocumentClick(e: MouseEvent) {
    const target = e.target as Node;
    const wrapper = document.getElementById('timer-wrapper');
    if (isPanelOpen && wrapper && !wrapper.contains(target)) {
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
    dom.minInput.addEventListener('focus', () => { activeInput = 'min'; dom.minInput.select(); });
    dom.secInput.addEventListener('focus', () => { activeInput = 'sec'; dom.secInput.select(); });
    dom.minInput.addEventListener('change', () => render());
    dom.secInput.addEventListener('change', () => render());
    dom.minInput.addEventListener('input', () => render());
    dom.secInput.addEventListener('input', () => render());
    dom.presetAddBtn.addEventListener('click', onAddPreset);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    closePanel();
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

  return {
    start: onStart,
    pause: () => {
      if (core.state === 'running') {
        if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
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
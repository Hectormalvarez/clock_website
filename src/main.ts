import './styles/main.css';
import { initClock } from './components/clock';
import { createTimer } from './components/timer';
import type { TimerState } from './components/timer';

const clock = initClock();
clock?.start();

// Timer
const timerDisplay = document.getElementById('timer-display');
const timerFinishTime = document.getElementById('timer-finish-time');
const timerMinInput = document.getElementById('timer-min') as HTMLInputElement | null;
const timerSecInput = document.getElementById('timer-sec') as HTMLInputElement | null;
const timerStartBtn = document.getElementById('timer-start') as HTMLButtonElement | null;
const timerResetBtn = document.getElementById('timer-reset') as HTMLButtonElement | null;
const timerDecMinBtn = document.getElementById('timer-dec-min') as HTMLButtonElement | null;
const timerIncMinBtn = document.getElementById('timer-inc-min') as HTMLButtonElement | null;
const timerToggleBtn = document.getElementById('timer-toggle') as HTMLButtonElement | null;
const timerPanel = document.getElementById('timer-panel');
const timerPresetsContainer = document.getElementById('timer-presets');
const timerPresetsBar = document.getElementById('timer-presets-bar');
const timerPresetAddBtn = document.getElementById('timer-preset-add') as HTMLButtonElement | null;

if (
  timerDisplay &&
  timerFinishTime &&
  timerMinInput &&
  timerSecInput &&
  timerStartBtn &&
  timerResetBtn &&
  timerDecMinBtn &&
  timerIncMinBtn &&
  timerToggleBtn &&
  timerPanel &&
  timerPresetsContainer &&
  timerPresetsBar &&
  timerPresetAddBtn
) {
  void createTimer(
    {
      display: timerDisplay,
      finishTimeEl: timerFinishTime,
      minInput: timerMinInput,
      secInput: timerSecInput,
      startBtn: timerStartBtn,
      resetBtn: timerResetBtn,
      decMinBtn: timerDecMinBtn,
      incMinBtn: timerIncMinBtn,
      toggleBtn: timerToggleBtn,
      panel: timerPanel,
      presetsContainer: timerPresetsContainer,
      presetsBar: timerPresetsBar,
      presetAddBtn: timerPresetAddBtn,
    },
    {
      onStateChange(state: TimerState) {
        // Add/remove running class on toggle button for pulse animation
        if (state === 'running') {
          timerToggleBtn.classList.add('running');
        } else {
          timerToggleBtn.classList.remove('running');
        }
      },
    },
  );
} else {
  console.error('Could not find all required timer elements.');
}
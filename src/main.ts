import './styles/main.css';
import { initClock } from '@/features/clock';
import { initTimer } from '@/features/timer';

const clockContainer = document.getElementById('clock-container');
if (clockContainer) {
	initClock(clockContainer)?.start();
}

const timerWrapper = document.getElementById('timer-wrapper');
if (timerWrapper) {
	initTimer(timerWrapper, { storageKey: 'main-timer-presets' });
}

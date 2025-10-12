import './styles/main.css';
import { createClock } from './clock';

const clockElement = document.getElementById('clock');
const timezoneElement = document.getElementById('timezone');
const environmentMarker = document.getElementById('environment-marker');

if (clockElement && timezoneElement && environmentMarker) {
  const clock = createClock({
    clock: clockElement,
    timezone: timezoneElement,
    environmentMarker: environmentMarker,
  });
  clock.start();
} else {
  console.error('Could not find all required clock elements.');
}
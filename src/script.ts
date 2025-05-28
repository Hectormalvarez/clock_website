import './style.css'; // Import the CSS file
import { getConfig } from '../config';

const clockElement = document.getElementById('clock');
const environmentMarker = document.getElementById('environment-marker');
const config = getConfig(import.meta.env.VITE_ENVIRONMENT, import.meta.env);

function updateClock(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    if (environmentMarker && config.environment === 'development') {
        environmentMarker.textContent = 'dev';
    } else if (environmentMarker) {
        environmentMarker.textContent = ''; // Clear for production
    }
}

// Update the clock immediately
updateClock();

// Update the clock every second
setInterval(updateClock, 1000);

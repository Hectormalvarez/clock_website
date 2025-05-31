import './style.css'; // Import the CSS file

const clockElement = document.getElementById('clock');
const timezoneElement = document.getElementById('timezone');
const environmentMarker = document.getElementById('environment-marker');

function updateClock(): void {
    const now = new Date();
    let hours24 = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';

    let hours12 = hours24 % 12;
    hours12 = hours12 ? hours12 : 12; // Convert hour '0' (midnight) to '12'

    const hoursStr = String(hours12); // Hour without leading zero
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (clockElement) {
        clockElement.textContent = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
    }

    if (timezoneElement) {
        timezoneElement.textContent = timeZone.replace('_', ' ');
    }

    if (environmentMarker && import.meta.env.MODE === 'development') {
        environmentMarker.textContent = 'DEV';
    } else if (environmentMarker) {
        environmentMarker.textContent = ''; // Clear for other modes
    }
}

// Update the clock immediately
updateClock();

// Update the clock every second
setInterval(updateClock, 1000);

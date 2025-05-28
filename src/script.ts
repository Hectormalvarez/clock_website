import './style.css'; // Import the CSS file

const clockElement = document.getElementById('clock');
const environmentMarker = document.getElementById('environment-marker');

function updateClock(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
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

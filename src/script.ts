import "./style.css"; // Import the CSS file
import { formatTime } from "./utils/time";

const clockElement = document.getElementById("clock");
const timezoneElement = document.getElementById("timezone");
const environmentMarker = document.getElementById("environment-marker");

function updateClock(): void {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat()
    .resolvedOptions()
    .timeZone.replace("_", " ");

  if (clockElement) {
    clockElement.textContent = formatTime(now);
  }

  if (timezoneElement) {
    timezoneElement.textContent = timeZone;
  }

  if (environmentMarker && import.meta.env.MODE === "development") {
    environmentMarker.textContent = "DEV";
  } else if (environmentMarker) {
    environmentMarker.textContent = ""; // Clear for other modes
  }
}

// Update the clock immediately
updateClock();

// Update the clock every second
setInterval(updateClock, 1000);

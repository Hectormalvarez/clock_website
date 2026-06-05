/**
 * Converts a 24-hour Date into 12-hour components.
 */
function to12Hour(date: Date): {
	hours: number;
	minutes: string;
	seconds: string;
	ampm: string;
} {
	const hours24 = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	const ampm = hours24 >= 12 ? 'PM' : 'AM';
	const hours12 = hours24 % 12 || 12;
	return { hours: hours12, minutes, seconds, ampm };
}

/**
 * Formats a Date object into a `h:mm:ss AM/PM` string.
 */
export function formatTime(date: Date): string {
	const { hours, minutes, seconds, ampm } = to12Hour(date);
	return `${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Formats a Date object into a `h:mm AM/PM` string for the document title.
 */
export function formatTimeForTitle(date: Date): string {
	const { hours, minutes, ampm } = to12Hour(date);
	return `${hours}:${minutes} ${ampm}`;
}

/**
 * Converts total seconds into a `MM:SS` string.
 */
export function formatDuration(totalSeconds: number): string {
	if (totalSeconds < 0) totalSeconds = 0;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Converts a number of seconds from now into a wall-clock time string.
 */
export function formatFinishTime(secondsFromNow: number): string {
	const finish = new Date(Date.now() + secondsFromNow * 1000);
	const { hours, minutes, seconds, ampm } = to12Hour(finish);
	return `${hours}:${minutes}:${seconds} ${ampm}`;
}

export interface TimeFormatOptions {
	timeZone?: string;
	showSeconds?: boolean;
	use12Hour?: boolean;
}

export function formatTime(
	date: Date,
	options: TimeFormatOptions = {},
): string {
	const {
		timeZone, // undefined falls back to local system timezone
		showSeconds = true,
		use12Hour = true,
	} = options;

	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		minute: '2-digit',
		second: showSeconds ? '2-digit' : undefined,
		hour12: use12Hour,
	});

	// Replace non-breaking spaces (\u202F) with standard spaces for consistent cross-browser testing
	return formatter.format(date).replace(/\u202F/g, ' ');
}

export function formatTimeForTitle(date: Date, timeZone?: string): string {
	return formatTime(date, { timeZone, showSeconds: false, use12Hour: true });
}

export function formatDuration(totalSeconds: number): string {
	if (totalSeconds < 0) totalSeconds = 0;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatFinishTime(secondsFromNow: number): string {
	const finish = new Date(Date.now() + secondsFromNow * 1000);
	return formatTime(finish, { showSeconds: true, use12Hour: true });
}

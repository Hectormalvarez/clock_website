/**
 * Plays a short beep using the Web Audio API.
 * Accepts an optional AudioContext for testability (dependency injection).
 */
export function playBeep(audioCtx?: AudioContext): Promise<void> {
	const isLocalCtx = !audioCtx;
	const ctx = audioCtx ?? new AudioContext();

	return new Promise((resolve) => {
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.type = 'square';
		oscillator.frequency.value = 880;

		gainNode.gain.value = 0.3;
		gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		oscillator.start();
		oscillator.stop(ctx.currentTime + 0.5);

		oscillator.onended = () => {
			if (isLocalCtx && ctx.state !== 'closed') {
				ctx.close().catch(console.error);
			}
			resolve();
		};
	});
}

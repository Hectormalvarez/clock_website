/**
 * Plays a short beep using the Web Audio API.
 * Returns a promise that resolves when the beep finishes.
 */
export function playBeep(): Promise<void> {
  return new Promise((resolve) => {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = 880;

    gainNode.gain.value = 0.3;
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.5
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);

    oscillator.onended = () => {
      audioCtx.close();
      resolve();
    };
  });
}
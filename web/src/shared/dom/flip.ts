/**
 * FLIP animation for the clock container when a panel is added/removed
 * (which re-centers the container in the body). Shared by the timer and
 * alarm panels so both open/close feel identical.
 *
 * Honors prefers-reduced-motion: when set (or when matchMedia is
 * unavailable and `reducedMotion` is passed explicitly), the DOM mutation
 * runs with no animation.
 */
export function flipAnimate(
	container: HTMLElement | null,
	action: () => void,
	options: { reducedMotion?: boolean } = {},
): void {
	if (!container) {
		action();
		return;
	}

	const reduceMotion =
		options.reducedMotion ??
		(typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	if (reduceMotion) {
		action();
		return;
	}

	// Lock body overflow so the page can't scroll while the height changes.
	const prevBodyOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';

	// First: record the current position of the container.
	const firstRect = container.getBoundingClientRect();

	// Run the DOM mutation (open/close panel).
	action();

	// Last: measure the new position synchronously.
	const lastRect = container.getBoundingClientRect();

	// Compute the delta and invert it with a transform.
	const dx = firstRect.left - lastRect.left;
	const dy = firstRect.top - lastRect.top;
	if (dx === 0 && dy === 0) {
		document.body.style.overflow = prevBodyOverflow;
		return;
	}

	container.style.transition = 'none';
	container.style.transform = `translate(${dx}px, ${dy}px)`;

	// Play: on the next frame, animate the transform back to identity.
	requestAnimationFrame(() => {
		container.style.transition = 'transform 0.3s ease-out';
		container.style.transform = '';
	});

	// Clean up inline styles after the transition completes.
	const onEnd = () => {
		container.removeEventListener('transitionend', onEnd);
		container.style.transition = '';
		container.style.transform = '';
		document.body.style.overflow = prevBodyOverflow;
	};
	container.addEventListener('transitionend', onEnd);

	// Fallback in case transitionend doesn't fire.
	window.setTimeout(onEnd, 400);
}

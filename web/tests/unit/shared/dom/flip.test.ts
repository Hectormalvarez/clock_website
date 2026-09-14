import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flipAnimate } from '@/shared/dom/flip';

describe('flipAnimate', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.append(container);
	});

	afterEach(() => {
		container.remove();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('runs the action with no animation when reduced motion is set', () => {
		let ran = false;
		flipAnimate(container, () => (ran = true), { reducedMotion: true });
		expect(ran).toBe(true);
		expect(container.style.transform).toBe('');
		expect(document.body.style.overflow).toBe('');
	});

	it('runs the action immediately when there is no container', () => {
		let ran = false;
		flipAnimate(null, () => (ran = true));
		expect(ran).toBe(true);
	});

	it('animates: locks overflow, inverts the delta, then cleans up', () => {
		vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				cb(0);
				return 0;
			}),
		);
		vi.spyOn(container, 'getBoundingClientRect')
			.mockReturnValueOnce({ top: 100, left: 10 } as DOMRect)
			.mockReturnValueOnce({ top: 60, left: 10 } as DOMRect);

		vi.useFakeTimers();
		let ran = false;
		flipAnimate(container, () => (ran = true));

		expect(ran).toBe(true);
		// dy = 100 - 60 = 40 → inverted transform applied.
		expect(container.style.transform).toBe('translate(0px, 40px)');
		expect(document.body.style.overflow).toBe('hidden');

		// transitionend never fires in jsdom — the fallback must clean up.
		vi.advanceTimersByTime(400);
		expect(container.style.transform).toBe('');
		expect(container.style.transition).toBe('');
		expect(document.body.style.overflow).toBe('');
	});

	it('cleans up immediately when the position did not change', () => {
		vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
		vi.spyOn(container, 'getBoundingClientRect')
			.mockReturnValueOnce({ top: 10, left: 10 } as DOMRect)
			.mockReturnValueOnce({ top: 10, left: 10 } as DOMRect);

		let ran = false;
		flipAnimate(container, () => (ran = true));

		expect(ran).toBe(true);
		expect(container.style.transform).toBe('');
		expect(document.body.style.overflow).toBe('');
	});

	it('treats an absent matchMedia as "motion allowed"', () => {
		vi.spyOn(container, 'getBoundingClientRect')
			.mockReturnValueOnce({ top: 10, left: 10 } as DOMRect)
			.mockReturnValueOnce({ top: 0, left: 10 } as DOMRect);
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				cb(0);
				return 0;
			}),
		);
		vi.useFakeTimers();

		let ran = false;
		flipAnimate(container, () => (ran = true));

		expect(ran).toBe(true);
		expect(container.style.transform).toBe('translate(0px, 10px)');
	});
});

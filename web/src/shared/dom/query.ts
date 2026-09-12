/**
 * Thin, typed wrappers around `Element.querySelector`.
 *
 * They exist so callers can state the element type they expect without
 * sprinkling `as HTMLInputElement | null` casts through every module.
 */

/** Query a single element, returning `null` when it is absent. */
export function queryOptional<T extends Element>(
	scope: ParentNode,
	selector: string,
): T | null {
	return scope.querySelector<T>(selector);
}

/**
 * Query a single element, throwing when it is absent.
 *
 * Use this when a missing element is a programming error rather than a
 * recoverable runtime condition.
 */
export function queryRequired<T extends Element>(
	scope: ParentNode,
	selector: string,
): T {
	const element = scope.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Required element not found: ${selector}`);
	}
	return element;
}

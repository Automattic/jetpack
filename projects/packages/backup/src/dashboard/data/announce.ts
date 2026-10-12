import { speak } from '@wordpress/a11y';

/** How long a message waits for others to join it. */
export const ANNOUNCE_WINDOW_MS = 500;

const queue = new Map< unknown, string >();
let assertive = false;
let timer: ReturnType< typeof setTimeout > | null = null;

/**
 * Speak a message together with any others that arrive within `ANNOUNCE_WINDOW_MS`.
 *
 * `speak()` empties both live regions before it writes, so two calls close together leave only the
 * second to be heard, whatever their politeness. One call carries them all, assertive if any was.
 *
 * @param message    - What to say.
 * @param politeness - How urgently to say it.
 * @param source     - Who is speaking: a newer message from the same source replaces one still waiting.
 */
export function announce(
	message: string,
	politeness: 'polite' | 'assertive' = 'polite',
	source: unknown = message
): void {
	queue.set( source, message );
	assertive = assertive || politeness === 'assertive';
	if ( timer ) {
		return;
	}
	timer = setTimeout( () => {
		const text = [ ...new Set( queue.values() ) ].join( ' ' );
		const live = assertive ? 'assertive' : 'polite';
		clearQueue();
		speak( text, live );
	}, ANNOUNCE_WINDOW_MS );
}

/** Forget whatever is waiting, along with its timer. */
function clearQueue(): void {
	if ( timer ) {
		clearTimeout( timer );
	}
	queue.clear();
	assertive = false;
	timer = null;
}

/**
 * Drop anything waiting to be spoken. Test-only.
 *
 * The queue is module state, so a test that ends inside the window would otherwise speak into the next.
 */
export function resetAnnouncerForTesting(): void {
	clearQueue();
}

import { speak } from '@wordpress/a11y';

/** How long a message waits for others to join it. */
export const ANNOUNCE_WINDOW_MS = 500;

type Politeness = 'polite' | 'assertive';

const queue = new Map< unknown, { message: string; politeness: Politeness } >();
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
	politeness: Politeness = 'polite',
	source: unknown = message
): void {
	// Deleted first: `set()` on a waiting source keeps its old place, not its arrival order.
	queue.delete( source );
	queue.set( source, { message, politeness } );
	if ( timer ) {
		return;
	}
	timer = setTimeout( () => {
		const entries = [ ...queue.values() ];
		clearQueue();
		speak(
			[ ...new Set( entries.map( entry => entry.message ) ) ].join( ' ' ),
			entries.some( entry => entry.politeness === 'assertive' ) ? 'assertive' : 'polite'
		);
	}, ANNOUNCE_WINDOW_MS );
}

/**
 * Withdraw a message that is still waiting, as when the notice it describes goes away.
 *
 * @param source - Who asked for it, as passed to `announce()`.
 */
export function cancelAnnouncement( source: unknown ): void {
	queue.delete( source );
	if ( ! queue.size ) {
		clearQueue();
	}
}

/** Forget whatever is waiting, along with its timer. */
function clearQueue(): void {
	if ( timer ) {
		clearTimeout( timer );
	}
	queue.clear();
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

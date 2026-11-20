export const LIBRARY_POLL_INTERVAL_MS = 5000;
export const PROCESSING_POLL_SLOW_INTERVAL_MS = 15000;
export const PROCESSING_POLL_BACKOFF_MS = 60000;

// Bound idle polling of orphaned records; returning to the tab still refreshes their status.
export const PROCESSING_POLL_MAX_MS = 15 * 60 * 1000;

/**
 * Back off long-running jobs and stop polling records that never finish.
 * @param hasProcessing - Whether any current item is still processing.
 * @param elapsedMs     - Time since the current processing set was first seen.
 * @return The next poll interval in ms, or false to stop polling.
 */
export function libraryRefetchInterval(
	hasProcessing: boolean,
	elapsedMs: number
): number | false {
	if ( ! hasProcessing || elapsedMs >= PROCESSING_POLL_MAX_MS ) {
		return false;
	}
	return elapsedMs < PROCESSING_POLL_BACKOFF_MS
		? LIBRARY_POLL_INTERVAL_MS
		: PROCESSING_POLL_SLOW_INTERVAL_MS;
}

export type ProcessingPollAnchor = {
	/** Sorted, comma-joined ids of the items that were processing when stamped. */
	idsKey: string;
	startedAt: number;
};

/**
 * Give each distinct set of processing items its own bounded polling window.
 * @param anchor        - The previously stored anchor, or null.
 * @param processingIds - Ids of the items currently processing (any order).
 * @param now           - Current epoch ms.
 * @return The anchor to store and the poll interval (false stops polling).
 */
export function nextProcessingPoll(
	anchor: ProcessingPollAnchor | null,
	processingIds: string[],
	now: number
): { anchor: ProcessingPollAnchor | null; interval: number | false } {
	if ( processingIds.length === 0 ) {
		// Processing cleared (or never started) — drop the anchor so the next
		// processing item gets a fresh budget.
		return { anchor: null, interval: libraryRefetchInterval( false, 0 ) };
	}
	const idsKey = [ ...processingIds ].sort().join( ',' );
	if ( anchor?.idsKey !== idsKey ) {
		anchor = { idsKey, startedAt: now };
	}
	return { anchor, interval: libraryRefetchInterval( true, now - anchor.startedAt ) };
}

/** How often to ask whether the purchase has reached the site. */
export const POLL_INTERVAL_MS = 3000;

/** How long to wait before offering a manual reload instead. */
export const POLL_TIMEOUT_MS = 60000;

export type ArrivalOutcome = { arrived: boolean; elapsedMs: number };

/**
 * Ask `hasFeature` every interval until it says yes, the timeout passes, or `signal` aborts.
 *
 * @param hasFeature      - Whether the plan includes the feature yet; a rejection counts as not yet.
 * @param options         - Timing and cancellation.
 * @param options.signal  - Stops polling once aborted.
 * @param options.sleep   - Waits the given milliseconds.
 * @param options.now     - The current time in milliseconds.
 * @param options.timeout - Milliseconds before giving up.
 * @return Whether the feature arrived, and after how long.
 */
export async function pollFeatureArrival(
	hasFeature: () => Promise< boolean >,
	{
		signal,
		sleep = ms => new Promise( resolve => setTimeout( resolve, ms ) ),
		now = Date.now,
		timeout = POLL_TIMEOUT_MS,
	}: {
		signal?: AbortSignal;
		sleep?: ( ms: number ) => Promise< unknown >;
		now?: () => number;
		timeout?: number;
	} = {}
): Promise< ArrivalOutcome > {
	const startedAt = now();

	while ( ! signal?.aborted && now() - startedAt < timeout ) {
		await sleep( POLL_INTERVAL_MS );

		if ( signal?.aborted ) {
			break;
		}

		if ( await hasFeature().catch( () => false ) ) {
			return { arrived: true, elapsedMs: now() - startedAt };
		}
	}

	return { arrived: false, elapsedMs: now() - startedAt };
}

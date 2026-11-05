/** How often to ask whether the purchase has reached the site. */
export const POLL_INTERVAL_MS = 3000;

/** How long to wait before offering a manual reload instead. */
export const POLL_TIMEOUT_MS = 60000;

/** Consecutive failed requests after which the route is taken to be unreachable. */
export const MAX_POLL_FAILURES = 5;

export type ArrivalOutcome = { arrived: boolean; elapsedMs: number; failures: number };

/**
 * Ask `hasFeature` every interval until it says yes, the timeout passes, it keeps failing, or `signal` aborts.
 *
 * @param hasFeature      - Whether the plan includes the feature yet.
 * @param options         - Timing and cancellation.
 * @param options.signal  - Stops polling once aborted.
 * @param options.sleep   - Waits the given milliseconds.
 * @param options.now     - The current time in milliseconds.
 * @param options.timeout - Milliseconds before giving up.
 * @return Whether the feature arrived, after how long, and how many requests had failed in a row.
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
	let failures = 0;

	while ( ! signal?.aborted && now() - startedAt < timeout && failures < MAX_POLL_FAILURES ) {
		await sleep( POLL_INTERVAL_MS );

		if ( signal?.aborted ) {
			break;
		}

		try {
			const arrived = await hasFeature();
			failures = 0;

			if ( arrived ) {
				return { arrived, elapsedMs: now() - startedAt, failures };
			}
		} catch {
			failures++;
		}
	}

	return { arrived: false, elapsedMs: now() - startedAt, failures };
}

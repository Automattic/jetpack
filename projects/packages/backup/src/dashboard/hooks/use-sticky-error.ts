import { useRef } from '@wordpress/element';

/**
 * Hold a query's error across its own retry.
 *
 * React Query v5 rewinds an errored query *that holds no data* back to
 * `status: 'pending'` when it refetches: a retry on a query that has
 * never succeeded is treated as a fresh first load. For the whole
 * duration of that retry `error` is null and `isLoading` is true.
 *
 * Every failure surface in this dashboard is written as
 * `error ? <QueryError/> : …`, so without this the reason vanished the
 * instant the reader clicked "Try again" — the activity list fell back
 * to DataViews' own "No results", which is the misleading empty state
 * D3 removed, and `QueryError`'s own `isRetrying` state could never
 * render because the component was already unmounted.
 *
 * Queries that hold data don't need this — they keep `status: 'success'`
 * across a refetch — but applying it uniformly costs nothing and means
 * a caller doesn't have to know which kind it has.
 *
 * @param error      - The error the query is reporting right now, if any.
 * @param isFetching - Whether a request is in flight.
 * @return The error to show: the current one, or the last one while its retry runs.
 */
export function useStickyError( error: Error | null, isFetching: boolean ): Error | null {
	// A ref rather than state: this derives a render-time value from the
	// arguments and must not schedule a render of its own. The assignment
	// is idempotent for a given pair, so a double render leaves it where
	// a single render would.
	const lastError = useRef< Error | null >( null );

	if ( error ) {
		lastError.current = error;
	} else if ( ! isFetching ) {
		// Settled without an error: the failure is genuinely over.
		lastError.current = null;
	}

	return error ?? lastError.current;
}

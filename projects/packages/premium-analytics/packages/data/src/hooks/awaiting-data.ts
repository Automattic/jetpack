type PlaceholderAwareQuery = {
	isLoading: boolean;
	isPlaceholderData: boolean;
};

/**
 * Whether nothing on screen answers the current params — what widgets gate
 * their skeleton on.
 *
 * Broader than React Query's `isLoading`, which a range change leaves false:
 * `placeholderData` keeps the previous params' response mounted, and React
 * Query calls that a success. `isFetching` is no help either — it is equally
 * true when unchanged params are revalidated, where the numbers on screen are
 * still the right answer (WOOA7S-1934).
 *
 * Awaiting means something is coming. A disabled query has nothing coming, so
 * it never awaits: pass `isEnabled` for a query a widget switches off, or the
 * placeholder it is left holding reads as a load that never finishes and pins
 * the widget in its skeleton. Switching a query off usually changes its params
 * in the same render — a metric the bucket cannot serve, a view no longer
 * selected — which is exactly what makes the result placeholder data.
 *
 * @param query     - A React Query result.
 * @param isEnabled - Whether that query is enabled. Defaults to true.
 * @return Whether the result has nothing valid for the current params.
 */
export function isAwaitingData( query: PlaceholderAwareQuery, isEnabled = true ): boolean {
	// Only the placeholder arm is gated. `refetch()` ignores `enabled`, so a
	// switched-off query can still have a real request in flight — and that one
	// is awaiting data however the query was configured.
	return query.isLoading || ( isEnabled && query.isPlaceholderData );
}

/**
 * `isAwaitingData` folded into a result's own `isLoading`, so hooks hand widgets
 * one flag. `isPlaceholderData` stays on the result for callers that need the
 * two apart.
 *
 * Spreading costs React Query's tracked-property optimization: reading every key
 * marks every key as tracked, so the caller also re-renders on fields it never
 * uses (`isStale` flipping at `staleTime`, for one). Cheap next to a fetch, and
 * the alternative is handing widgets a flag whose name lies.
 *
 * @param query     - A React Query result.
 * @param isEnabled - Whether that query is enabled. Defaults to true; see
 *                  `isAwaitingData` for why a switched-off query never awaits.
 * @return The same result with `isLoading` widened.
 */
export function withAwaitedDataLoading< TQuery extends PlaceholderAwareQuery >(
	query: TQuery,
	isEnabled = true
): TQuery {
	return { ...query, isLoading: isAwaitingData( query, isEnabled ) };
}

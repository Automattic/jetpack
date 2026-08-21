type PlaceholderAwareQuery = {
	isLoading: boolean;
	isPlaceholderData: boolean;
	isFetching: boolean;
};

/**
 * Whether nothing on screen answers the current params — what widgets gate
 * their skeleton on.
 *
 * Broader than React Query's `isLoading`, which a range change leaves false:
 * `placeholderData` keeps the previous params' response mounted, and React
 * Query calls that a success. Neither remaining flag says it alone — a
 * revalidation of unchanged params is equally `isFetching`, and there the
 * numbers on screen are still the right answer (WOOA7S-1934). Together they
 * are exact: stale data on screen *and* a request in flight to replace it.
 *
 * The conjunction is also what unpins a query a widget switches off. Switching
 * a query off usually changes its params in the same render — a metric the
 * bucket cannot serve, a view no longer selected — so it is left holding
 * placeholder data that no fetch will ever replace, since a disabled query does
 * not fetch. Reading that as a load still in flight pinned the widget in its
 * skeleton for good. Not fetching, so not awaiting. `refetch()` deliberately
 * ignores `enabled`, so a switched-off query genuinely reloading still awaits.
 *
 * @param query - A React Query result.
 * @return Whether the result has nothing valid for the current params.
 */
export function isAwaitingData( query: PlaceholderAwareQuery ): boolean {
	return query.isLoading || ( query.isPlaceholderData && query.isFetching );
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
 * @param query - A React Query result.
 * @return The same result with `isLoading` widened.
 */
export function withAwaitedDataLoading< TQuery extends PlaceholderAwareQuery >(
	query: TQuery
): TQuery {
	return { ...query, isLoading: isAwaitingData( query ) };
}

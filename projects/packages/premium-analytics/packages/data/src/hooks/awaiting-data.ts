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
 * @param query - A React Query result.
 * @return Whether the result has nothing valid for the current params.
 */
export function isAwaitingData( query: PlaceholderAwareQuery ): boolean {
	return query.isLoading || query.isPlaceholderData;
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

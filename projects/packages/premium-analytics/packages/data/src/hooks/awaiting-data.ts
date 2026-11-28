type PlaceholderAwareQuery = {
	isLoading: boolean;
	isPlaceholderData: boolean;
	isFetching: boolean;
	isPaused: boolean;
};

/**
 * Whether nothing on screen answers the current params — what widgets gate
 * their skeleton on.
 *
 * Neither React Query flag says this alone: `placeholderData` leaves
 * `isLoading` false across a range change, and `isFetching` is equally true
 * while revalidating unchanged params, whose numbers on screen are still right
 * (WOOA7S-1934). A fetch paused offline is still coming, so it counts; a query
 * the widget switched off is idle instead, holding placeholder data no fetch
 * will replace, and must not pin the skeleton.
 */
export function isAwaitingData( query: PlaceholderAwareQuery ): boolean {
	return query.isLoading || ( query.isPlaceholderData && ( query.isFetching || query.isPaused ) );
}

/**
 * `isAwaitingData` folded into a result's own `isLoading`, so hooks hand widgets
 * one flag.
 *
 * Spreading forfeits React Query's tracked-property optimization — every key
 * reads as tracked, so callers re-render on fields they never use. Cheap next
 * to a fetch.
 */
export function withAwaitedDataLoading< TQuery extends PlaceholderAwareQuery >(
	query: TQuery
): TQuery {
	return { ...query, isLoading: isAwaitingData( query ) };
}

/**
 * External dependencies
 */
import { useStatsAuthor } from '@jetpack-premium-analytics/data';
import { useCallback } from '@wordpress/element';

export type AuthorAllTimeStart = {
	/** The author's first content, as an offset-bearing instant; undefined until known. */
	allTimeStart?: string;
	/** Whether the start is loading or failed, so all time cannot anchor yet. */
	isPending: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

// Today alone: the response carries the first content date whatever the window.
const ANCHOR_PARAMS = { period: 'day', num: 1 } as const;

/**
 * Where all time starts for one author: their first content of any type, pages
 * and products included, since Stats credits those views to the author too.
 *
 * @param authorId - The user ID from the route.
 * @return The start and its request state.
 */
export function useAuthorAllTimeStart( authorId: number ): AuthorAllTimeStart {
	const { data, isPlaceholderData, isLoading, isError, error, refetch } = useStatsAuthor(
		authorId,
		ANCHOR_PARAMS
	);

	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	// Another author's date must not anchor this page while it loads.
	const firstContentDate = isPlaceholderData ? undefined : data?.firstContentDate;

	return {
		// The endpoint reports it in GMT; the date controls read an offset-less stamp as site time.
		allTimeStart: firstContentDate ? `${ firstContentDate.replace( ' ', 'T' ) }Z` : undefined,
		isPending: isLoading || isError,
		isError,
		error,
		refetch: retry,
	};
}

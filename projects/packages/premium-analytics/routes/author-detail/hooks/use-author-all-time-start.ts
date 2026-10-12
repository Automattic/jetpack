/**
 * External dependencies
 */
import {
	getApiErrorCode,
	useStatsAuthor,
	useStatsAuthorAllTime,
} from '@jetpack-premium-analytics/data';
import { useCallback } from '@wordpress/element';

export type AuthorAllTimeStart = {
	/** Where the author's all time starts, as a site-local day or a GMT instant; undefined until known. */
	allTimeStart?: string;
	/** Whether there is no start yet because it is loading or failed. */
	isPending: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

// Today alone, read through the ranking: cheap even past the post limit, and
// its first content date stays exact.
const APPROXIMATE_START_PARAMS = { period: 'day', num: 1, approximate: true } as const;

/**
 * Where all time starts for one author: the first day their views can start,
 * from the request the All-time traffic table already makes. An author past the
 * endpoint's post limit falls back to their first published content.
 *
 * @param authorId - The user ID from the route.
 * @return The start and its request state.
 */
export function useAuthorAllTimeStart( authorId: number ): AuthorAllTimeStart {
	const allTime = useStatsAuthorAllTime( authorId );
	const isOverPostLimit = getApiErrorCode( allTime.error ) === 'too_many_posts';
	const approximate = useStatsAuthor( authorId, APPROXIMATE_START_PARAMS, {
		enabled: isOverPostLimit,
	} );
	const source = isOverPostLimit ? approximate : allTime;
	const { refetch } = source;

	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	let allTimeStart: string | undefined;
	// Another author's dates must not anchor this page while it loads.
	if ( ! source.isPlaceholderData ) {
		const firstContentDate = approximate.data?.firstContentDate;
		allTimeStart = isOverPostLimit
			? // GMT; the date controls read an offset-less stamp as site time.
				firstContentDate && `${ firstContentDate.replace( ' ', 'T' ) }Z`
			: ( allTime.data?.startDate ?? undefined );
	}

	return {
		allTimeStart: allTimeStart || undefined,
		// A background refetch that fails keeps the start it already has.
		isPending: ! allTimeStart && ( source.isLoading || source.isError ),
		isError: source.isError,
		error: source.error,
		refetch: retry,
	};
}

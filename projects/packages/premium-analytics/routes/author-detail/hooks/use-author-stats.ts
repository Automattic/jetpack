/**
 * External dependencies
 */
import {
	getApiErrorCode,
	useStatsAuthor,
	useStatsAuthorAllTime,
} from '@jetpack-premium-analytics/data';

// Today alone, read through the ranking: cheap even past the post limit, and
// its first content date stays exact.
const APPROXIMATE_START_PARAMS = { period: 'day', num: 1, approximate: true } as const;

/**
 * The author's all-time `stats/author` request, or today's approximate one when
 * the author is past the endpoint's post limit. The page's header and its All
 * time start both read whichever answers.
 *
 * @param authorId - The user ID from the route.
 * @return The answering request, and whether it is the approximate fallback.
 */
export function useAuthorStats( authorId: number ) {
	const allTime = useStatsAuthorAllTime( authorId );
	const isOverPostLimit = getApiErrorCode( allTime.error ) === 'too_many_posts';
	const approximate = useStatsAuthor( authorId, APPROXIMATE_START_PARAMS, {
		enabled: isOverPostLimit,
	} );

	return { source: isOverPostLimit ? approximate : allTime, isOverPostLimit };
}

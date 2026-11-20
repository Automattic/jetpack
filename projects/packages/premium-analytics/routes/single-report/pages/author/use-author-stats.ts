/**
 * External dependencies
 */
import { useStatsAuthorAllTimeOrApproximate } from '@jetpack-premium-analytics/data';

/**
 * Read the endpoint's `first_content_date` (`Y-m-d H:i:s`, GMT) as an instant;
 * an offset-less stamp would be read as site time.
 *
 * @param stamp - The raw GMT stamp.
 * @return An ISO instant, or undefined without a stamp.
 */
export function toGmtInstant( stamp: string | null | undefined ): string | undefined {
	return stamp ? `${ stamp.replace( ' ', 'T' ) }Z` : undefined;
}

/**
 * The author's all-time `stats/author` report, or today's approximate one when
 * they are past the endpoint's post limit. The page's header and its All time
 * start both read it.
 *
 * @param authorId - The user ID from the route.
 * @return The query result.
 */
export function useAuthorStats( authorId: number ) {
	return useStatsAuthorAllTimeOrApproximate( authorId );
}

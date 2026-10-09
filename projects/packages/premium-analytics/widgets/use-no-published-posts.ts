/**
 * External dependencies
 */
import {
	latestPostQuery,
	useStatsQuery,
	type LatestPostResponse,
} from '@jetpack-premium-analytics/data';

export function useNoPublishedPosts( enabled: boolean ): boolean {
	const result = useStatsQuery< LatestPostResponse >( latestPostQuery(), { enabled } );

	return enabled && ! result.isError && result.data === null;
}

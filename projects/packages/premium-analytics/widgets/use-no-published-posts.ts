/**
 * External dependencies
 */
import {
	latestPostQuery,
	useStatsQuery,
	type LatestPostResponse,
} from '@jetpack-premium-analytics/data';

export function useNoPublishedPosts( enabled: boolean ): {
	noPublishedPosts: boolean;
	isChecking: boolean;
} {
	const result = useStatsQuery< LatestPostResponse >( latestPostQuery(), { enabled } );

	return {
		noPublishedPosts: enabled && ! result.isError && result.data === null,
		isChecking: enabled && result.isLoading,
	};
}

/**
 * External dependencies
 */
import {
	usePostThumbnails,
	useStatsTopPosts,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	createViewLiveAction,
	describeError,
	getPostsReportQueryParams,
	toViewLiveUrl,
	useWidgetNavigationSearch,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getPostsFields } from './fields';
import type { DataViewsSource, DataViewsSourceRecords, DataViewsSourceScope } from '../types';

const ORIGIN = { report: 'posts', section: 'posts-pages' } as const;

const NO_POSTS: StatsTopPostsComparisonItem[] = [];

/**
 * Every post and page of the window, with the thumbnails of the rows on screen.
 *
 * @return The rows, their fields and actions, and the state of the request.
 */
function usePostsRecords( {
	reportParams,
	pageItems,
}: DataViewsSourceScope< StatsTopPostsComparisonItem > ): DataViewsSourceRecords< StatsTopPostsComparisonItem > {
	const recordsParams = useMemo(
		() => getPostsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsTopPosts( recordsParams );

	const thumbnailUrls = usePostThumbnails( pageItems );
	const detailSearch = useWidgetNavigationSearch( { origin: ORIGIN } );
	const fields = useMemo(
		() => getPostsFields( hasComparison, detailSearch, thumbnailUrls ),
		[ hasComparison, detailSearch, thumbnailUrls ]
	);
	const actions = useMemo(
		() => [
			createViewLiveAction< StatsTopPostsComparisonItem >( item =>
				toViewLiveUrl( 'post', item.id, item.link )
			),
		],
		[]
	);

	return {
		data: comparisonRows?.rows ?? NO_POSTS,
		fields,
		actions,
		searchLabel: __( 'Search posts', 'jetpack-premium-analytics-pkg' ),
		isLoading,
		isFetching,
		isError,
		error: describeError( error, {
			retryDescription: __(
				"We couldn't load posts. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			),
			onRetry: refetch,
		} ),
	};
}

export const postsSource: DataViewsSource< StatsTopPostsComparisonItem > = {
	// The post ID, or the label for a row without one, such as the homepage's.
	getItemId: item => String( item.id ?? item.label ),
	useRecords: usePostsRecords,
};

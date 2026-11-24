/**
 * External dependencies
 */
import {
	usePostThumbnails,
	useStatsTopPosts,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	WidgetDataTable,
	WidgetRoot,
	createViewLiveAction,
	describeError,
	getPostsReportQueryParams,
	toViewLiveUrl,
	useWidgetNavigationSearch,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { getPostsFields } from './fields';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

export type PostsTableAttributes = Record< never, never >;

type PostsTableRenderAttributes = PostsTableAttributes & Partial< ReportParamsFieldAttributes >;

const ORIGIN = { report: 'posts', section: 'posts-pages' } as const;

const NO_POSTS: StatsTopPostsComparisonItem[] = [];

const INITIAL_VIEW = {
	titleField: 'title',
	mediaField: 'thumbnail',
	fields: [ 'views' ],
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			views: { align: 'end' as const },
		},
	},
};

/**
 * Stable row id: the post ID, or the label for a row without one, such as the homepage's.
 *
 * @param item - The post row.
 * @return The row id.
 */
function getPostRowId( item: StatsTopPostsComparisonItem ): string {
	return String( item.id ?? item.label );
}

/**
 * Every post and page of the period, as a searchable, paginated table.
 *
 * @return The table, or the state that stands in for it.
 */
function PostsTable() {
	const { reportParams } = useWidgetRootContext();

	const recordsParams = useMemo(
		() => getPostsReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const { comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsTopPosts( recordsParams );

	const [ pageRows, setPageRows ] = useState< StatsTopPostsComparisonItem[] >( [] );
	const thumbnailUrls = usePostThumbnails( pageRows );

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

	return (
		<WidgetDataTable< StatsTopPostsComparisonItem >
			data={ comparisonRows?.rows ?? NO_POSTS }
			fields={ fields }
			getItemId={ getPostRowId }
			status={ { isLoading, isFetching, isError } }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load posts. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			initialView={ INITIAL_VIEW }
			actions={ actions }
			searchLabel={ __( 'Search posts', 'jetpack-premium-analytics-pkg' ) }
			onChangePageItems={ setPageRows }
		/>
	);
}

/**
 * The posts table of the All pages report.
 *
 * @param {WidgetRenderProps} props - The host's props.
 * @return The widget.
 */
export default function PostsTableWidget( {
	attributes = {},
}: WidgetRenderProps< PostsTableRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostsTable />
		</WidgetRoot>
	);
}

/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostViews from './use-post-views';
import type { PostViewsAttributes, PostViewsChartType, PostViewsGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostViewsRenderAttributes = PostViewsAttributes & Partial< ReportParamsFieldAttributes >;
type PostViewsWidgetProps = WidgetRenderProps< PostViewsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type PostViewsInnerProps = {
	/** The granularity attribute: the chart's bucket size. */
	granularity: PostViewsGranularity;
	/** How the views series is drawn. `MetricTabsChart` owns the default. */
	chartType?: PostViewsChartType;
};

/**
 * Without a post scope (e.g. the widget added outside a post detail page) the
 * query never enables and the empty state shows.
 */
function PostViewsInner( { granularity, chartType }: PostViewsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { current, isLoading, isFetching, isError, hasData, refetch } = usePostViews(
		postId,
		reportParams,
		granularity
	);

	// One "Views" metric: the headline is the window total (views are summed
	// per bucket, so the sum of buckets is the range's views). The post detail
	// page has no comparison control, so there is no previous series.
	const metricTabs = useMemo< MetricTab[] >(
		() => [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				value: current.reduce( ( sum, point ) => sum + point.value, 0 ),
				current,
			},
		],
		[ current ]
	);
	const groupLabel = __( 'Post views metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				// `isFetching` is deliberately not passed: the chart renders its
				// own scoped overlay below, so WidgetState's full-widget one
				// would double up and cover the metric headline.
				isError={ isError }
				isEmpty={ postId <= 0 }
				error={ {
					description: __(
						"We couldn't load this post's views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __(
						'Open a post or page report to see its views here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					loading={ isFetching }
					groupLabel={ groupLabel }
				/>
			</WidgetState>
		</div>
	);
}

export default function PostViews( { attributes = {} }: PostViewsWidgetProps ) {
	// Coerce unknown persisted values to the defaults.
	const attrGranularity = attributes?.granularity;
	const granularity =
		attrGranularity === 'week' || attrGranularity === 'month' ? attrGranularity : 'day';
	const chartType = attributes?.chartType === 'bar' ? 'bar' : 'line';

	return (
		<WidgetRoot attributes={ attributes }>
			<PostViewsInner granularity={ granularity } chartType={ chartType } />
		</WidgetRoot>
	);
}

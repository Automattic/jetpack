/**
 * External dependencies
 */
import { STATS_CHART_BUCKET_PERIODS, toPostId } from '@jetpack-premium-analytics/data';
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import {
	HEADLINE_COUNT_FORMAT,
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
	getPostTypeCopy,
	metricTabsToCsv,
	useReportActions,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostViews from './use-post-views';

import type { PostViewsAttributes, PostViewsChartType } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostViewsRenderAttributes = PostViewsAttributes & Partial< ReportParamsFieldAttributes >;
type PostViewsWidgetProps = WidgetRenderProps< PostViewsRenderAttributes >;

type PostViewsInnerProps = {
	/** How the views series is drawn. `MetricTabsChart` owns the default. */
	chartType?: PostViewsChartType;
};

/**
 * Without a post scope (e.g. the widget added outside a post detail page) the
 * query never enables and the empty state shows.
 */
function PostViewsInner( { chartType }: PostViewsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );
	const period = defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );

	const { current, postType, isLoading, isFetching, isError, refetch } = usePostViews(
		postId,
		reportParams,
		period
	);

	// The post detail page has no comparison control, so there is no previous
	// series, and the headline is just the sum of the window's buckets.
	const metricTabs = useMemo< MetricTab[] >(
		() => [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				countLabel: count =>
					/* translators: %s: number of views. */
					_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' ),
				value: current.reduce( ( sum, point ) => sum + point.value, 0 ),
				current,
			},
		],
		[ current ]
	);
	const csv = useMemo(
		() =>
			metricTabsToCsv( current.some( point => point.value > 0 ) ? metricTabs : [], {
				zone: reportingTimeZone(),
				withTime: false,
				dateLabel: __( 'Date', 'jetpack-premium-analytics-pkg' ),
			} ),
		[ current, metricTabs ]
	);
	useReportActions( {
		csv: {
			...csv,
			filenamePrefix: `post-${ postId }-views`,
			range: { from: reportParams.from, to: reportParams.to },
			status: { isLoading, isFetching, isError },
		},
	} );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
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
					description: __(
						'Open a post or page report to see its views here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				// The chart is the whole content here, so its block replaces the
				// generic stacked lines.
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ HEADLINE_COUNT_FORMAT }
					chartType={ chartType }
					chartTitle={ getPostTypeCopy( postType ).views }
					empty={ <ChartEmptyState /> }
					hideSingleMetricLabel
				/>
			</WidgetState>
		</div>
	);
}

export default function PostViews( { attributes = {} }: PostViewsWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'line' ? 'line' : 'bar';

	return (
		<WidgetRoot attributes={ attributes }>
			<PostViewsInner chartType={ chartType } />
		</WidgetRoot>
	);
}

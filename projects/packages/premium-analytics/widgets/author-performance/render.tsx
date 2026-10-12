/**
 * External dependencies
 */
import { STATS_CHART_BUCKET_PERIODS, toAuthorId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
	describeError,
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
import useAuthorPerformance from './use-author-performance';
import type { AuthorPerformanceAttributes, AuthorPerformanceChartType } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type AuthorPerformanceRenderAttributes = AuthorPerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;
type AuthorPerformanceWidgetProps = WidgetRenderProps< AuthorPerformanceRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type AuthorPerformanceInnerProps = {
	chartType?: AuthorPerformanceChartType;
};

/**
 * Without an author scope (the widget added outside an author detail page) the
 * query never enables and the empty state shows.
 */
function AuthorPerformanceInner( { chartType }: AuthorPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const authorId = toAuthorId( reportParams.author_id );
	const period = defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );

	const {
		current,
		views,
		likes,
		comments,
		isLoading,
		isFetching,
		isError,
		error,
		hasData,
		refetch,
	} = useAuthorPerformance( authorId, reportParams, period );

	// The detail page has no comparison control, so there is no previous series.
	const metricTabs = useMemo< MetricTab[] >( () => {
		const totalOnly = __(
			'Only the total for the period is available for this metric.',
			'jetpack-premium-analytics-pkg'
		);
		const notCounted = __( "This metric isn't available.", 'jetpack-premium-analytics-pkg' );

		// Likes and comments come back as window totals, with no per-bucket series.
		const totalTab = ( tab: Omit< MetricTab, 'value' | 'current' >, value: number | null ) =>
			value === null
				? { ...tab, value: 0, current: [], unavailable: notCounted }
				: { ...tab, value, current: [], seriesUnavailable: totalOnly };

		return [
			{
				key: 'views',
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				countLabel: count =>
					/* translators: %s: number of views. */
					_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' ),
				value: views,
				current,
			},
			totalTab(
				{
					key: 'likes',
					label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
					countLabel: count =>
						/* translators: %s: number of likes. */
						_n( '%s Like', '%s Likes', count, 'jetpack-premium-analytics-pkg' ),
				},
				likes
			),
			totalTab(
				{
					key: 'comments',
					label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
					countLabel: count =>
						/* translators: %s: number of comments. */
						_n( '%s Comment', '%s Comments', count, 'jetpack-premium-analytics-pkg' ),
				},
				comments
			),
		];
	}, [ current, views, likes, comments ] );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// Stale buckets stay on screen through a failed background refetch.
				isError={ ! hasData && isError }
				isEmpty={ authorId <= 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load this author's stats. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ {
					icon: reports,
					description: __(
						'Open an author to see their stats here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					empty={ <ChartEmptyState /> }
				/>
			</WidgetState>
		</div>
	);
}

export default function AuthorPerformance( { attributes = {} }: AuthorPerformanceWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'line' ? 'line' : 'bar';

	return (
		<WidgetRoot attributes={ attributes }>
			<AuthorPerformanceInner chartType={ chartType } />
		</WidgetRoot>
	);
}

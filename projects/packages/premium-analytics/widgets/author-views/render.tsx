/**
 * External dependencies
 */
import { STATS_CHART_BUCKET_PERIODS, toAuthorId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	defaultPeriodForInterval,
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
import useAuthorViews from './use-author-views';
import type { AuthorViewsAttributes, AuthorViewsChartType } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type AuthorViewsRenderAttributes = AuthorViewsAttributes & Partial< ReportParamsFieldAttributes >;
type AuthorViewsWidgetProps = WidgetRenderProps< AuthorViewsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type AuthorViewsInnerProps = {
	chartType?: AuthorViewsChartType;
};

/**
 * Without an author scope (the widget added outside an author detail page) the
 * query never enables and the empty state shows.
 */
function AuthorViewsInner( { chartType }: AuthorViewsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const authorId = toAuthorId( reportParams.author_id );
	const period = defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );

	const { current, isLoading, isFetching, isError, hasData, refetch } = useAuthorViews(
		authorId,
		reportParams,
		period
	);

	// The detail page has no comparison control, so there is no previous series,
	// and the headline is the sum of the window's buckets.
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

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// Stale buckets stay on screen through a failed background refetch.
				isError={ ! hasData && isError }
				isEmpty={ authorId <= 0 }
				error={ {
					description: __(
						"We couldn't load this author's views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __(
						'Open an author to see their views here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
				/>
			</WidgetState>
		</div>
	);
}

export default function AuthorViews( { attributes = {} }: AuthorViewsWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const chartType = attributes?.chartType === 'bar' ? 'bar' : 'line';

	return (
		<WidgetRoot attributes={ attributes }>
			<AuthorViewsInner chartType={ chartType } />
		</WidgetRoot>
	);
}

/**
 * External dependencies
 */
import {
	ReportScopeProvider,
	chartInterval,
	useStatsSubscribersCounts,
} from '@jetpack-premium-analytics/data';
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type MetricTab,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { defaultReportParams } from './default-report-params';
import { SUBSCRIBERS_GRAIN } from './grain';
import styles from './style.module.css';
import useSubscribersChart, {
	type SubscribersChartPoint,
	type SubscribersChartState,
	type SubscribersPeriod,
} from './use-subscribers-chart';
import {
	SUBSCRIBERS_CHART_METRICS,
	type SubscribersChartAttributes,
	type SubscribersChartMetricId,
	type SubscribersChartType,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type SubscribersChartWidgetProps = WidgetRenderProps< SubscribersChartAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
	preferExact: true,
};

/**
 * The latest value of a metric in a window — each point is the cumulative count
 * as of that period, so the headline value is the last point, not a sum.
 */
function latest(
	points: SubscribersChartPoint[],
	accessor: ( point: SubscribersChartPoint ) => number | null
): number {
	return points.length ? ( accessor( points[ points.length - 1 ] ) ?? 0 ) : 0;
}

/**
 * Pulls each metric's value off a chart point. Ids and labels come from
 * `SUBSCRIBERS_CHART_METRICS` in `widget.ts`.
 */
const METRIC_ACCESSORS: Record<
	SubscribersChartMetricId,
	( point: SubscribersChartPoint ) => number | null
> = {
	subscribers: point => point.subscribers,
	paid: point => point.paid,
};

/**
 * Build the metric tabs from the fetched state, in canonical order, with Paid
 * subscribers only when the site has any. Each tab carries its headline total
 * and the per-period points for the chart.
 */
function buildMetrics( state: SubscribersChartState ): MetricTab[] {
	return SUBSCRIBERS_CHART_METRICS.filter( ( { id } ) => id !== 'paid' || state.hasPaid ).map(
		( { id, label, countLabel } ) => {
			const accessor = METRIC_ACCESSORS[ id ];
			return {
				key: id,
				label,
				countLabel,
				value: latest( state.current, accessor ),
				current: state.current.map( point => ( { date: point.date, value: accessor( point ) } ) ),
			};
		}
	);
}

type SubscribersChartInnerProps = {
	/**
	 * How to draw the selected metric. `MetricTabsChart` owns the default.
	 */
	chartType?: SubscribersChartType;
};

/**
 * The bucket size follows the window the widget's own date control saved. The
 * "Chart type" control is the `chartType` attribute (`relevance: 'high'`),
 * rendered by the widget host. Which metric is plotted is the chart's own tab
 * selection.
 */
function SubscribersChartInner( { chartType }: SubscribersChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const period: SubscribersPeriod = chartInterval( reportParams, SUBSCRIBERS_GRAIN.periods );

	const state = useSubscribersChart( reportParams, period );
	// Paid subscribers are a subset, so no subscriber in the range empties every tab.
	const isChartEmpty =
		! state.isLoading && ! state.isError && state.current.every( point => ! point.subscribers );
	const counts = useStatsSubscribersCounts( undefined, { enabled: isChartEmpty } );
	// An unread total says nothing about the site, so only a known zero changes the copy.
	const hasNoSubscribers = counts.data?.total_subscribers === 0;
	const metricTabs = useMemo( () => buildMetrics( state ), [ state ] );
	const groupLabel = __( 'Subscriber metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ state.isLoading || ( isChartEmpty && counts.isLoading ) }
				isFetching={ state.isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the chart visible; only surface the error
				// when there is nothing to show.
				isError={ state.current.length === 0 && state.isError }
				isEmpty={ isChartEmpty }
				error={ {
					description: __(
						"We couldn't load subscriber data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: state.refetch },
					],
				} }
				empty={
					hasNoSubscribers
						? {
								description: __(
									'You don’t have subscribers yet. Newsletter can help you turn readers into an audience.',
									'jetpack-premium-analytics-pkg'
								),
								action: {
									label: __( 'Learn more', 'jetpack-premium-analytics-pkg' ),
									href: 'https://jetpack.com/support/newsletter/',
									openInNewTab: true,
								},
							}
						: undefined
				}
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					tickResolution={ period }
					groupLabel={ groupLabel }
					baseline="padded"
					chartTitle={ __( 'Subscriber summary', 'jetpack-premium-analytics-pkg' ) }
				/>
			</WidgetState>
		</div>
	);
}

export default function SubscribersChart( {
	attributes = {},
	setError,
}: SubscribersChartWidgetProps ) {
	const reportParams = attributes.reportParams ?? defaultReportParams();

	return (
		<ReportScopeProvider offersComparison={ false }>
			<WidgetRoot
				attributes={ { ...attributes, reportParams } }
				setError={ setError }
				options={ { from: '/' } }
			>
				<SubscribersChartInner chartType={ attributes.chartType } />
			</WidgetRoot>
		</ReportScopeProvider>
	);
}

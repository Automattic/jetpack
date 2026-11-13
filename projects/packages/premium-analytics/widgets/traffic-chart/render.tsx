/**
 * External dependencies
 */
import { getAdminUrl } from '@automattic/jetpack-script-data';
import {
	chartInterval,
	useReportScope,
	useScopeLockedIntervals,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime, reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import {
	HEADLINE_COUNT_FORMAT,
	bucketRange,
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	metricTabsToCsv,
	useReportActions,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useNoPublishedPosts } from '../use-no-published-posts';
import { usePreviousPeriodShown } from '../use-previous-period-shown';
import { trafficIntervalExtension } from './interval-extension';
import styles from './style.module.css';
import useTrafficChart from './use-traffic-chart';
import { TRAFFIC_PERIODS, defaultChartType } from './widget';
import type { TrafficChartAttributes, TrafficChartGranularity, TrafficChartType } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type TrafficChartRenderAttributes = TrafficChartAttributes & Partial< ReportParamsFieldAttributes >;
type TrafficChartWidgetProps = WidgetRenderProps< TrafficChartRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

type TrafficChartInnerProps = {
	/**
	 * How to draw the selected metric.
	 */
	chartType: TrafficChartType;

	/**
	 * The saved bucket size, if any.
	 */
	interval?: TrafficChartGranularity;
};

/**
 * The bucket size is the widget's own, clamped to what the range allows; which
 * metric is plotted is the chart's own tab selection.
 */
function TrafficChartInner( { chartType, interval }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// A host without a period to set leaves the bars inert.
	const { openPeriod } = useReportScope();
	const lockedIntervals = useScopeLockedIntervals();
	const [ previousPeriodShown, setPreviousPeriodShown ] = usePreviousPeriodShown(
		'trafficChartPreviousPeriod'
	);
	const period: TrafficChartGranularity = chartInterval(
		{ ...reportParams, interval },
		TRAFFIC_PERIODS,
		lockedIntervals,
		trafficIntervalExtension( reportParams, chartType )
	);

	// Names the bucket size drawn, not the saved one: the range may clamp it,
	// and the click must open the bar it hit.
	const openBucket = useMemo( () => {
		if ( ! openPeriod ) {
			return undefined;
		}

		const window = {
			from: parseSiteDateTime( reportParams.from ),
			to: parseSiteDateTime( reportParams.to ),
		};

		return ( date: Date ) => {
			const range = bucketRange( date, period, window, { timeZone: reportingTimeZone() } );

			if ( range ) {
				openPeriod( range );
			}
		};
	}, [ openPeriod, period, reportParams.from, reportParams.to ] );

	const {
		metrics: metricTabs,
		isLoading,
		isFetching,
		isError,
		csvIsError,
		csvIsPlaceholderData,
		timezone,
		refetch,
	} = useTrafficChart( reportParams, period );
	const groupLabel = __( 'Traffic metric', 'jetpack-premium-analytics-pkg' );
	const views = metricTabs.find( metric => metric.key === 'views' );

	// Export only when the current period has views; a previous period's views don't count.
	const csv = useMemo(
		() =>
			views?.current.some( point => ( point.value ?? 0 ) > 0 )
				? metricTabsToCsv( metricTabs, {
						zone: timezone,
						withTime: period === 'hour',
						dateLabel: __( 'Date', 'jetpack-premium-analytics-pkg' ),
					} )
				: undefined,
		[ metricTabs, views, timezone, period ]
	);
	useReportActions( {
		csv: csv && {
			...csv,
			filenamePrefix: 'traffic-summary',
			hasDateRange: true,
			status: {
				isLoading,
				isFetching,
				isError: csvIsError,
				isPlaceholderData: csvIsPlaceholderData,
			},
		},
	} );

	const viewsAreEmpty =
		! isLoading &&
		! isError &&
		views?.value === 0 &&
		views.current.every( point => point.value === 0 || point.value === null ) &&
		( views.previous?.every( point => point.value === 0 || point.value === null ) ?? true );
	const { noPublishedPosts, isChecking } = useNoPublishedPosts( viewsAreEmpty );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading || isChecking }
				isFetching={ isFetching }
				// `useTrafficChart` already gates `isError` per query on that query
				// having no rows, so a transient refetch failure keeps the chart.
				isError={ isError }
				error={ {
					description: __(
						"We couldn't load traffic data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ HEADLINE_COUNT_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					tickResolution={ period }
					onDatumClick={ openBucket }
					previousPeriodShown={ previousPeriodShown }
					onPreviousPeriodShownChange={ setPreviousPeriodShown }
					empty={
						noPublishedPosts ? (
							<ChartEmptyState
								text={ __(
									"You haven't published any posts yet. Get started by creating your first one.",
									'jetpack-premium-analytics-pkg'
								) }
								action={ {
									label: __( 'Create post', 'jetpack-premium-analytics-pkg' ),
									href: getAdminUrl( 'post-new.php' ),
								} }
							/>
						) : (
							<ChartEmptyState />
						)
					}
				/>
			</WidgetState>
		</div>
	);
}

export default function TrafficChart( { attributes = {}, setError }: TrafficChartWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TrafficChartInner
				chartType={ attributes.chartType ?? defaultChartType() }
				interval={ attributes.chartInterval }
			/>
		</WidgetRoot>
	);
}

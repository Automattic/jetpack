/**
 * External dependencies
 */
import { chartInterval, useReportScope } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime, reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import {
	bucketRange,
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
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

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
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
	// Clamped like the widget's interval control, so the chart draws the bucket it names.
	const period: TrafficChartGranularity = chartInterval(
		{ ...reportParams, interval },
		TRAFFIC_PERIODS
	);

	// A host without a period to set leaves the bars inert.
	const { openPeriod } = useReportScope();

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
		refetch,
	} = useTrafficChart( reportParams, period );
	const groupLabel = __( 'Traffic metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `useTrafficChart` already gates `isError` per query on that query
				// having no rows, so a transient refetch failure keeps the chart.
				isError={ isError }
				// `stats/visits` zero-fills every bucket of an idle window, so emptiness is judged per metric inside the chart, where the tabs keep showing their zeros.
				isEmpty={ false }
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
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					tickResolution={ period }
					onDatumClick={ openBucket }
					empty={ <ChartEmptyState /> }
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

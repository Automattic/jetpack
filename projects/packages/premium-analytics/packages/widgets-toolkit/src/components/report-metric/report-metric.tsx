/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@automattic/charts';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTimeSeriesChartData } from '../../helpers';
import { MetricComparisonWidget } from '../../widgets/metric-comparison';
import { WidgetState } from '../widget-state';
import type { DataFormat } from '../../types';

/**
 * Generic type for report data with time series
 */
type ReportData = {
	summary: {
		date_start: string;
		date_end: string;
		[ key: string ]: string | number;
	};
	data: Array< {
		date_start: string;
		[ key: string ]: string | number;
	} >;
};

/**
 * Type for the data prop - the result from useReport hooks
 */
type ReportHookResult = {
	primary: { data?: ReportData };
	comparison: { data?: ReportData };
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
	error: Error | null | undefined;
	refetch: () => void;
};

export type ReportMetricWidgetProps = {
	/**
	 * The metric key to display from the data
	 */
	metricKey: string;

	/**
	 * The report data from useReport hooks (e.g., useReportOrders, useReportVisitors)
	 */
	data: ReportHookResult;

	/**
	 * The format configuration for the metric
	 */
	dataFormat: DataFormat;
};

/**
 * Report Metric Widget - Internal Component
 *
 * @param {ReportMetricWidgetProps} props - The component props
 *
 * @internal
 */
export function ReportMetricWidget( { metricKey, data, dataFormat }: ReportMetricWidgetProps ) {
	const { getElementStyles } = useGlobalChartsContext();

	const primaryData = data.primary.data;
	const comparisonData = data.comparison.data;
	const { isLoading, isFetching, hasData, isError, refetch } = data;

	// Build series[] data.
	const series = buildTimeSeriesChartData( {
		primary: primaryData ?? {
			summary: {
				date_start: '',
				date_end: '',
				[ metricKey ]: 0,
			},
			data: [],
		},
		comparison: comparisonData,
		metricKey,
		emptyDataFallback: 'empty-array',
	} );

	// Build seriesStyles[] data.
	const seriesStyles = useMemo(
		() =>
			series.map( ( seriesData, index ) => {
				const { color, lineStyles } = getElementStyles( {
					data: seriesData,
					index,
				} );

				return {
					stroke: color,
					...lineStyles,
				};
			} ),
		[ series, getElementStyles ]
	);

	// metricKey always refers to a numeric metric field (e.g., "visitors", "orders_no"),
	// never to date fields (e.g., "date_start"). The summary type includes both for flexibility,
	// but we know the actual value will be a number at runtime.
	const primaryValue = ( primaryData?.summary[ metricKey ] as number ) ?? 0;
	const comparisonValue = comparisonData?.summary[ metricKey ] as number | undefined;

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			// A resolved report with no time-series rows has nothing meaningful to
			// chart — a bare summary (even an all-zero one) still renders as ready.
			isEmpty={ ! primaryData?.data?.length }
			error={ {
				description: __(
					"We couldn't load this data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
		>
			<MetricComparisonWidget
				value={ primaryValue }
				comparisonValue={ comparisonValue }
				series={ series }
				seriesStyles={ seriesStyles }
				dataFormat={ dataFormat }
			/>
		</WidgetState>
	);
}

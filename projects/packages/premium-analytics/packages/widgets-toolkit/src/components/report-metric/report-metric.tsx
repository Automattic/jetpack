/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@automattic/charts';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTimeSeriesChartData } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { MetricComparisonWidget } from '../../widgets/metric-comparison';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
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
	const { isLoading, isFetching, hasData, isError, error, refetch } = data;

	// Compute unified loading states (same logic as useWidgetLoading in dashboard v1)
	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = ( isLoading || isFetching ) && hasData;

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

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null; // Dashboard shows error UI via WidgetErrorBoundary
	}

	// No data and not loading = nothing to show
	if ( ! primaryData && ! isInitialLoading ) {
		return null;
	}

	// metricKey always refers to a numeric metric field (e.g., "visitors", "orders_no"),
	// never to date fields (e.g., "date_start"). The summary type includes both for flexibility,
	// but we know the actual value will be a number at runtime.
	const primaryValue = ( primaryData?.summary[ metricKey ] as number ) ?? 0;
	const comparisonValue = comparisonData?.summary[ metricKey ] as number | undefined;

	return (
		<>
			<MetricComparisonWidget
				value={ primaryValue }
				comparisonValue={ comparisonValue }
				series={ series }
				seriesStyles={ seriesStyles }
				dataFormat={ dataFormat }
			/>
			{ ( isInitialLoading || isRefetching ) && <WidgetLoadingOverlay /> }
		</>
	);
}

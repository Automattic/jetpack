/**
 * External dependencies
 */
import { useGlobalChartsContext, Icon } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTimeSeriesChartData } from '../../helpers';
import { MetricComparisonWidget } from '../../widgets/metric-comparison';
import { WidgetState } from '../widget-state';
import type { DataFormat } from '../../types';

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
	metricKey: string;

	/**
	 * The report data from useReport hooks (e.g., useReportOrders, useReportVisitors)
	 */
	data: ReportHookResult;

	dataFormat: DataFormat;

	/**
	 * Icon for the empty state (default: chartBar, the shared glyph of the
	 * metric/over-time widgets this component backs).
	 */
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];

	emptyStateText?: string;

	/**
	 * Copy for the error state. This component is generic over `metricKey`, and a
	 * key does not identify a widget (`orders_no` backs both Orders over time and
	 * Bookings over time), so the copy has to come from the caller.
	 */
	errorText?: string;

	/**
	 * The metric's name, for the legend. Comes from the caller for the same
	 * reason the copy above does. Omit it and the legend falls back to the date
	 * ranges `buildTimeSeriesChartData` labels the series with.
	 */
	seriesLabel?: string;
};

/**
 * @internal
 */
export function ReportMetricWidget( {
	metricKey,
	data,
	dataFormat,
	emptyStateIcon = chartBar,
	emptyStateText,
	errorText,
	seriesLabel,
}: ReportMetricWidgetProps ) {
	const { getElementStyles } = useGlobalChartsContext();

	const primaryData = data.primary.data;
	const comparisonData = data.comparison.data;
	const { isLoading, isFetching, hasData, isError, refetch } = data;

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
		label: seriesLabel,
	} );

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

	// metricKey always names a numeric field, never a date field; the summary
	// type covers both for flexibility, so the cast to number is safe here.
	const primaryValue = ( primaryData?.summary[ metricKey ] as number ) ?? 0;
	const comparisonValue = comparisonData?.summary[ metricKey ] as number | undefined;

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			// The report queries keep placeholders from the previous period across
			// range changes, so only surface the error when nothing is left to show.
			isError={ isError && ! hasData }
			// Empty keys off the time-series row count, not summary values: no rows
			// means nothing to chart, while rows with an all-zero summary stay ready.
			isEmpty={ ! primaryData?.data?.length }
			error={ {
				// Omitted copy falls back to WidgetState's generic line, so the
				// default lives in one place instead of being restated here.
				description: errorText,
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: emptyStateIcon,
				description: emptyStateText,
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

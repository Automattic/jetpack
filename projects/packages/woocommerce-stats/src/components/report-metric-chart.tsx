/**
 * External dependencies
 */
import {
	buildMetricTab,
	ChartEmptyState,
	MetricTabsChart,
	WidgetState,
	type ChartDisplayChartType,
	type DataFormat,
	type ReportResult,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-metric-chart.module.css';

/** What the chart reads from a report's rows and summary. */
type Report = {
	summary?: Record< string, unknown >;
	data?: Array< { date_start: string } >;
};

type ReportMetricChartProps = {
	/** The result of a report hook, such as `useReportOrders`. */
	report: ReportResult< Report >;
	/** The report field to chart, read from each row and from the summary. */
	field: string;
	/** The metric's name, for the headline and the legend. */
	label: string;
	/** Reads a count out for the tooltip and the legend, e.g. '3 Orders'. */
	countLabel?: ( count: number ) => string;
	/** How the metric's values are written. */
	dataFormat: DataFormat;
	/** How the series is drawn. `MetricTabsChart` owns the default. */
	chartType?: ChartDisplayChartType;
	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle: string;
	errorText: string;
	/** Shown in place of the value when the summary has no reading, e.g. an average over no orders. */
	noDataLabel?: string;
};

/**
 * One metric of a report over time, with the previous period when the report compares.
 *
 * @param {ReportMetricChartProps} props - The component props.
 * @return {JSX.Element} The chart, or the loading, error or empty state of its report.
 */
export function ReportMetricChart( {
	report,
	field,
	label,
	countLabel,
	dataFormat,
	chartType,
	chartTitle,
	errorText,
	noDataLabel,
}: ReportMetricChartProps ) {
	const primary = report.primary.data;
	const comparison = report.comparison.data;
	const { hasComparison, timezone, periodStarts } = report;

	const metrics = useMemo(
		() => [
			buildMetricTab( {
				primary,
				comparison,
				hasComparison,
				field,
				label,
				countLabel,
				noDataLabel,
				zone: timezone,
				periodStarts,
			} ),
		],
		[
			primary,
			comparison,
			hasComparison,
			field,
			label,
			countLabel,
			noDataLabel,
			timezone,
			periodStarts,
		]
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ report.isLoading }
				isFetching={ report.isFetching }
				// The queries keep the previous range's rows on screen, so an error only shows without them.
				isError={ report.isError && ! report.hasData }
				isEmpty={ ! primary?.data?.length }
				error={ {
					description: errorText,
					actions: [
						{ label: __( 'Retry', 'jetpack-woocommerce-stats-pkg' ), onClick: report.refetch },
					],
				} }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ dataFormat }
					chartType={ chartType }
					empty={ <ChartEmptyState /> }
					hideSingleMetricLabel
					chartTitle={ chartTitle }
				/>
			</WidgetState>
		</div>
	);
}

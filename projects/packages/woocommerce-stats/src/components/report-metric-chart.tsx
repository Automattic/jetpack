/**
 * External dependencies
 */
import {
	buildMetricTab,
	MetricTabsChart,
	WidgetState,
	type DataFormat,
	type ReportResult,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
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
	emptyText: string;
	errorText: string;
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
	emptyText,
	errorText,
}: ReportMetricChartProps ) {
	const primary = report.primary.data;
	const comparison = report.comparison.data;
	const { hasComparison, timezone } = report;

	const metrics = useMemo(
		() => [
			buildMetricTab( {
				primary,
				comparison,
				hasComparison,
				field,
				label,
				countLabel,
				zone: timezone,
			} ),
		],
		[ primary, comparison, hasComparison, field, label, countLabel, timezone ]
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
				empty={ { icon: chartBar, description: emptyText } }
			>
				<MetricTabsChart metrics={ metrics } dataFormat={ dataFormat } />
			</WidgetState>
		</div>
	);
}

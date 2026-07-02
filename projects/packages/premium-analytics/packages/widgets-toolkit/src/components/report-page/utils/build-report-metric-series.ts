/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import type {
	ComparativeDatePointDate,
	ComparativeLineChartSeries,
} from '../../chart-comparative-line/types';
import type { ReportChartMetric } from '../types';
import type { StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';

/**
 * Map a time-series report's points to chart points for one metric. Each
 * `StatsTimeSeriesDataPoint` carries every requested `stat_fields` metric as a
 * raw field keyed by name (`views`, `visitors`, …).
 *
 * @param report - The time-series report.
 * @param key    - The metric field to read from each point.
 * @return The chart points, oldest first.
 */
function toChartPoints( report: StatsTimeSeriesReport, key: string ): ComparativeDatePointDate[] {
	return ( report.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		value: Number( point[ key ] ?? 0 ),
	} ) );
}

/**
 * A series' legend label as its date range (first to last point) — consistent
 * with the other comparative charts (see `buildTimeSeriesChartData`).
 *
 * @param report - The time-series report.
 * @return The formatted date range, or '' when empty.
 */
function rangeLabel( report: StatsTimeSeriesReport ): string {
	const first = report.data?.[ 0 ];
	const last = report.data?.[ report.data.length - 1 ];
	return first && last
		? formatDateRange( {
				from: localTZDate( first.date_start ),
				to: localTZDate( last.date_end ?? last.date_start ),
		  } )
		: '';
}

/**
 * Build the performance chart series from a visits time-series report: one
 * solid series per visible metric, labelled by metric name.
 *
 * When exactly one metric is visible and a comparison report is provided, the
 * previous period is added as a same-`group` (same colour) dashed `comparison`
 * series with a transparent fill, and both series are labelled by date range
 * instead — mirroring `MetricTabsChart`. With multiple visible metrics the
 * comparison is omitted: overlaying a dashed twin per metric would make the
 * chart unreadable.
 *
 * @param options            - The build options.
 * @param options.primary    - The current-period time-series report.
 * @param options.comparison - The previous-period report, when comparison is enabled.
 * @param options.metrics    - The visible metrics, in render order.
 * @return The chart series.
 */
export function buildReportMetricSeries( {
	primary,
	comparison,
	metrics,
}: {
	primary?: StatsTimeSeriesReport;
	comparison?: StatsTimeSeriesReport;
	metrics: ReportChartMetric[];
} ): ComparativeLineChartSeries[] {
	if ( ! primary?.data?.length ) {
		return [];
	}

	const series: ComparativeLineChartSeries[] = metrics.map( metric => ( {
		label: metric.label,
		group: metric.key,
		data: toChartPoints( primary, metric.key ),
	} ) );

	const single = metrics.length === 1 ? metrics[ 0 ] : undefined;
	if ( single && comparison?.data?.length ) {
		series[ 0 ].label = rangeLabel( primary );
		series.push( {
			label: rangeLabel( comparison ),
			group: single.key,
			data: toChartPoints( comparison, single.key ),
			options: {
				type: 'comparison',
				gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
			},
		} );
	}

	return series;
}

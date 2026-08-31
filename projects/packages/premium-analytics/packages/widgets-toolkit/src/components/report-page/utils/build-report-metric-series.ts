/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	buildTimeSeriesChartData,
	type TimeSeriesData,
} from '../../../helpers/build-time-series-chart-data';
import type {
	ComparativeDatePointDate,
	ComparativeLineChartSeries,
} from '../../chart-comparative-line/types';
import type { ReportChartMetric } from '../types';
import type { StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';

type ReportTimeSeriesResponse = {
	data: TimeSeriesData[];
	summary: { date_start: string; date_end: string };
};

/**
 * Map a time-series report's points to chart points for one metric. A
 * `StatsTimeSeriesDataPoint` carries every requested `stat_fields` metric as a raw
 * field keyed by name (`views`, `visitors`, …).
 */
function toChartPoints( report: StatsTimeSeriesReport, key: string ): ComparativeDatePointDate[] {
	return ( report.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		value: Number( point[ key ] ?? 0 ),
	} ) );
}

/**
 * Project the report page's richer time-series point shape into the generic response
 * shape `buildTimeSeriesChartData` expects, for one metric.
 */
function toTimeSeriesResponse(
	report: StatsTimeSeriesReport,
	key: string
): ReportTimeSeriesResponse {
	const first = report.data?.[ 0 ];
	const last = report.data?.[ report.data.length - 1 ];

	return {
		summary: {
			date_start:
				typeof report.summary.date_start === 'string'
					? report.summary.date_start
					: first?.date_start ?? '',
			date_end:
				typeof report.summary.date_end === 'string'
					? report.summary.date_end
					: last?.date_end ?? last?.date_start ?? '',
		},
		data: ( report.data ?? [] ).map( point => ( {
			date_start: point.date_start,
			[ key ]: Number( point[ key ] ?? 0 ),
		} ) ),
	};
}

function buildSingleMetricSeries(
	primary: StatsTimeSeriesReport,
	comparison: StatsTimeSeriesReport | undefined,
	metric: ReportChartMetric
): ComparativeLineChartSeries[] {
	const series = buildTimeSeriesChartData( {
		primary: toTimeSeriesResponse( primary, metric.key ),
		comparison: comparison?.data?.length
			? toTimeSeriesResponse( comparison, metric.key )
			: undefined,
		metricKey: metric.key,
		label: metric.label,
	} );

	// Group by metric rather than the helper's shared `primary`, so each metric on
	// a multi-metric chart resolves its own colour.
	series.forEach( entry => {
		entry.group = metric.key;
	} );

	if ( ! series[ 1 ] ) {
		return series;
	}

	series[ 1 ].options = {
		...series[ 1 ].options,
		gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
	};

	return series;
}

/**
 * Build the performance chart series from a visits time-series report: one solid
 * series per visible metric.
 *
 * A single visible metric with a comparison report also gets the previous period as a
 * same-`group` dashed series, so the two collapse into one legend item. With several
 * metrics the comparison is dropped: a dashed twin each would be unreadable.
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

	const single = metrics.length === 1 ? metrics[ 0 ] : undefined;
	if ( single ) {
		return buildSingleMetricSeries( primary, comparison, single );
	}

	const series: ComparativeLineChartSeries[] = metrics.map( metric => ( {
		label: metric.label,
		group: metric.key,
		data: toChartPoints( primary, metric.key ),
	} ) );

	return series;
}

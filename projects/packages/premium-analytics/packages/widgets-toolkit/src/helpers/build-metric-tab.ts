/**
 * External dependencies
 */
import { parseBucketStart } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { MetricTab } from '../components';
import type { DataFormat } from '../types';

/**
 * The shape `buildMetricTab` reads: a normalized Stats report's summary plus its
 * time series. Both `StatsVisitsResponse` and `StatsWordAdsResponse` satisfy it.
 */
export type MetricReport = {
	summary?: Record< string, unknown >;
	data?: Array< { date_start: string } >;
};

export type BuildMetricTabOptions< TReport extends MetricReport > = {
	/** The current-period report for this field. */
	primary: TReport | undefined;
	/** The previous-period report, when comparison is on. */
	comparison: TReport | undefined;
	/** Whether the dashboard comparison is enabled. */
	hasComparison: boolean;
	/** The metric field, also used as the tab key. */
	field: string;
	/** The translated tab label. */
	label: string;
	/** Per-metric format override (e.g. currency); falls back to the chart default. */
	dataFormat?: DataFormat;
};

/**
 * Read a field's total from a report's summary. Reports carry dynamic WPCOM
 * keys, so the field is looked up rather than typed. Deliberately does not use
 * `summaryCount`: a chart headline needs a number to render, not an absence.
 *
 * @param report - The normalized report, or undefined while loading.
 * @param field  - The metric field to read.
 * @return The summary total, or 0 when the report is empty.
 */
function total( report: MetricReport | undefined, field: string ): number {
	return Number( report?.summary?.[ field ] ?? 0 );
}

/**
 * Map a field of a normalized report into chart points.
 *
 * @param report - The normalized report, or undefined while loading.
 * @param field  - The metric field to read from each period.
 * @return One point per period, oldest first.
 */
function toPoints( report: MetricReport | undefined, field: string ) {
	return ( report?.data ?? [] ).flatMap( point => {
		const date = parseBucketStart( point.date_start );

		return date
			? [ { date, value: Number( ( point as Record< string, unknown > )[ field ] ?? 0 ) } ]
			: [];
	} );
}

/**
 * Build one metric tab from a primary/comparison report pair. The previous-period
 * total/overlay appear only when comparison is on and the comparison request
 * actually returned rows — an empty or loading response would otherwise total to a misleading 0.
 *
 * @param options - The report pair, field, and presentation options.
 * @return The metric tab.
 */
export function buildMetricTab< TReport extends MetricReport >(
	options: BuildMetricTabOptions< TReport >
): MetricTab {
	const { primary, comparison, hasComparison, field, label, dataFormat } = options;
	const previous = hasComparison ? toPoints( comparison, field ) : undefined;
	const hasPrevious = !! previous?.length;

	return {
		key: field,
		label,
		value: total( primary, field ),
		previousValue: hasPrevious ? total( comparison, field ) : undefined,
		current: toPoints( primary, field ),
		previous: hasPrevious ? previous : undefined,
		dataFormat,
	};
}

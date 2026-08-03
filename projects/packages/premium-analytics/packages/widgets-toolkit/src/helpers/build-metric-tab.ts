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
 * Parse a bucket's `date_start` as a wall-clock date in the browser frame —
 * the chart library's convention (its own parsing treats naive date strings
 * as local, and its auto axis ticks and time scale operate browser-locally).
 * Stats buckets label site-local wall-clock stamped with a nominal `+00:00`,
 * so the stamp is stripped rather than honored: parsing it as a real instant
 * would shift every bucket by the browser offset — an hourly chart's ticks
 * and points would read hours (or, across midnight, a day) off.
 *
 * @param value - The bucket's `date_start`.
 * @return The wall-clock date.
 */
function toWallClockDate( value: string ): Date {
	const naive = value
		.trim()
		.replace( /(?:Z|[+-]00:?00)$/, '' )
		.replace( ' ', 'T' );

	return new Date( naive.includes( 'T' ) ? naive : `${ naive }T00:00:00` );
}

/**
 * Map a field of a normalized report into chart points.
 *
 * @param report - The normalized report, or undefined while loading.
 * @param field  - The metric field to read from each period.
 * @return One point per period, oldest first.
 */
function toPoints( report: MetricReport | undefined, field: string ) {
	return ( report?.data ?? [] ).map( point => ( {
		date: toWallClockDate( point.date_start ),
		value: Number( ( point as Record< string, unknown > )[ field ] ?? 0 ),
	} ) );
}

/**
 * Build one metric tab from a primary/comparison report pair. The headline is
 * the period total; the previous-period total and overlay are included only when
 * comparison is on *and* the comparison request actually returned rows — while
 * that request is still loading or came back empty, its total would be `0`,
 * which would render a misleading previous-period value.
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

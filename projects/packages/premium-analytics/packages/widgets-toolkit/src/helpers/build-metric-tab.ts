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

const nominalOffset = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Read a bucket's `date_start` as the wall clock it names.
 *
 * Bucket stamps carry a nominal `+00:00` rather than a real offset (see
 * `getStatsIntervalFields`), and the chart library formats a point through the
 * browser's timezone — so keeping the offset shifts every label by the viewer's
 * own offset, turning a midnight bucket into the previous day west of UTC.
 * Dropping it and parsing the remaining wall clock locally keeps a label on the
 * bucket it names.
 *
 * The axis reads these points in the viewer's timezone while tooltips go through
 * `formatDate`, which resolves the site's, so the two agree only while the viewer
 * sits in the site's timezone. Closing that remaining gap belongs to the tooltip.
 *
 * @param dateStart - The bucket's `date_start`.
 * @return The bucket's wall clock as a local instant.
 */
function toChartDate( dateStart: string ): Date {
	const wallClock = dateStart.replace( nominalOffset, '' );

	// A bare `yyyy-MM-dd` parses as UTC rather than as the local wall clock,
	// which would reintroduce the same day shift. Most branches stamp a time via
	// `formatDatePartWithTime`, but the `row.date_start` passthrough in
	// `getRowIntervalFields` forwards whatever the API sent.
	return new Date( wallClock.includes( 'T' ) ? wallClock : `${ wallClock }T00:00:00` );
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
		date: toChartDate( point.date_start ),
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

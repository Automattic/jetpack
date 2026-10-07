/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { MetricTab, MetricTabDatum } from '../components';
import type { CountLabel, DataFormat } from '../types';

/**
 * The shape `buildMetricTab` reads: a normalized Stats report's summary plus its
 * time series. Both `StatsVisitsResponse` and `StatsWordAdsResponse` satisfy it.
 */
export type MetricReport = {
	summary?: Record< string, unknown >;
	data?: Array< { date_start: string; date_end?: string; pending?: boolean } >;
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
	countLabel?: CountLabel;
	/** The timezone the reports were built and normalized under. */
	zone: string;
	/**
	 * What the tooltip says for a bucket the report flags `pending`, in place of
	 * a reading: the source has not counted it yet.
	 */
	pendingLabel?: string;
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
 * @param report       - The normalized report, or undefined while loading.
 * @param field        - The metric field to read from each period.
 * @param zone         - The report's reporting timezone.
 * @param pendingLabel - Carried as the note of a point the report flags `pending`.
 * @return One point per period, oldest first; a null reading stays null, drawn as a gap.
 */
function toPoints(
	report: MetricReport | undefined,
	field: string,
	zone: string,
	pendingLabel?: string
): MetricTabDatum[] {
	return ( report?.data ?? [] ).flatMap( point => {
		const date = resolveBucketStamp( point.date_start, zone );
		if ( ! date ) {
			return [];
		}

		const endDate = resolveBucketStamp( point.date_end, zone );
		const raw = ( point as Record< string, unknown > )[ field ];
		const value = raw === null ? null : Number( raw ?? 0 );
		const datum: MetricTabDatum = endDate ? { date, endDate, value } : { date, value };
		return [ point.pending && pendingLabel ? { ...datum, note: pendingLabel } : datum ];
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
	const {
		primary,
		comparison,
		hasComparison,
		field,
		label,
		dataFormat,
		countLabel,
		zone,
		pendingLabel,
	} = options;
	// The comparison period ends before today, so it has no uncounted day.
	const previous = hasComparison ? toPoints( comparison, field, zone ) : undefined;
	const hasPrevious = !! previous?.length;

	return {
		key: field,
		label,
		value: total( primary, field ),
		previousValue: hasPrevious ? total( comparison, field ) : undefined,
		current: toPoints( primary, field, zone, pendingLabel ),
		previous: hasPrevious ? previous : undefined,
		dataFormat,
		countLabel,
	};
}

/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { pairComparisonBuckets, type ComparisonPeriodStarts } from './pair-comparison-buckets';
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
	/**
	 * Set to show a null summary, such as an average over no orders, as no value instead of 0.
	 * The chart then says it in place of the plot when the comparison has no reading to draw,
	 * and draws a null bucket at 0 that its tooltip reads as no value.
	 */
	noDataLabel?: string;
	/**
	 * Where each period starts. With it, each comparison point is drawn on the current
	 * bucket covering the same days; without it, on the current bucket in its position.
	 */
	periodStarts?: ComparisonPeriodStarts;
};

/**
 * Read a field's total from a report's summary. Reports carry dynamic WPCOM
 * keys, so the field is looked up rather than typed.
 *
 * @param report - The normalized report, or undefined while loading.
 * @param field  - The metric field to read.
 * @return The summary total, 0 when the report is empty, or null when the summary has no reading.
 */
function total( report: MetricReport | undefined, field: string ): number | null {
	const value = report?.summary?.[ field ];
	return value === null ? null : Number( value ?? 0 );
}

type ReportRow = NonNullable< MetricReport[ 'data' ] >[ number ];

/**
 * Map one bucket of a normalized report to a chart point.
 *
 * @param point             - The report's bucket.
 * @param field             - The metric field to read.
 * @param zone              - The report's reporting timezone.
 * @param pendingLabel      - Carried as the note of a point the report flags `pending`.
 * @param drawMissingAtZero - Draw a null reading at 0, flagged `missing`, instead of as a gap.
 * @return The point, or undefined when the bucket has no readable date.
 */
function toPoint(
	point: ReportRow,
	field: string,
	zone: string,
	pendingLabel?: string,
	drawMissingAtZero = false
): MetricTabDatum | undefined {
	const date = resolveBucketStamp( point.date_start, zone );
	if ( ! date ) {
		return undefined;
	}

	const endDate = resolveBucketStamp( point.date_end, zone );
	const raw = ( point as Record< string, unknown > )[ field ];
	const value = raw === null ? null : Number( raw ?? 0 );
	const reading = value === null && drawMissingAtZero ? { value: 0, missing: true } : { value };
	const datum: MetricTabDatum = endDate ? { date, endDate, ...reading } : { date, ...reading };
	return point.pending && pendingLabel ? { ...datum, note: pendingLabel } : datum;
}

/** Map a field of a normalized report into chart points, oldest first; see `toPoint`. */
function toPoints(
	report: MetricReport | undefined,
	field: string,
	zone: string,
	pendingLabel?: string,
	drawMissingAtZero = false
): MetricTabDatum[] {
	return ( report?.data ?? [] ).flatMap( point => {
		const datum = toPoint( point, field, zone, pendingLabel, drawMissingAtZero );
		return datum ? [ datum ] : [];
	} );
}

/**
 * The comparison's points, each on the current bucket it pairs with by period and
 * carrying its own date in `realDate`. An unpaired bucket gets a null stand-in, since the
 * keyboard tooltip reads every series at the same index; none at all when nothing pairs.
 *
 * @param primary           - The current period's report.
 * @param comparison        - The comparison period's report.
 * @param field             - The metric field to read.
 * @param zone              - The reports' reporting timezone.
 * @param periodStarts      - Where each period starts.
 * @param drawMissingAtZero - Draw a null reading at 0, flagged `missing`, instead of as a gap.
 * @return The placed points, oldest first.
 */
function toPairedPoints(
	primary: MetricReport | undefined,
	comparison: MetricReport | undefined,
	field: string,
	zone: string,
	periodStarts: ComparisonPeriodStarts,
	drawMissingAtZero: boolean
): MetricTabDatum[] {
	const currentRows = primary?.data ?? [];
	const comparisonRows = comparison?.data ?? [];
	const pairs = pairComparisonBuckets( currentRows, comparisonRows, periodStarts );

	const points = currentRows.flatMap( ( row, index ): MetricTabDatum[] => {
		const pairedIndex = pairs[ index ];
		const date = resolveBucketStamp( row.date_start, zone );
		if ( ! date ) {
			return [];
		}

		const own =
			pairedIndex === undefined
				? undefined
				: toPoint( comparisonRows[ pairedIndex ], field, zone, undefined, drawMissingAtZero );

		return [ own ? { ...own, date, realDate: own.date } : { date, value: null } ];
	} );

	return points.some( point => point.realDate ) ? points : [];
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
		noDataLabel,
		periodStarts,
	} = options;
	// The comparison period ends before today, so it has no uncounted day.
	const drawMissingAtZero = !! noDataLabel;
	let previous: MetricTabDatum[] | undefined;
	if ( hasComparison ) {
		previous = periodStarts
			? toPairedPoints( primary, comparison, field, zone, periodStarts, drawMissingAtZero )
			: toPoints( comparison, field, zone, undefined, drawMissingAtZero );
	}
	// The total stands for the whole comparison, even when no bucket of it is drawn.
	const hasComparisonRows = hasComparison && !! comparison?.data?.length;
	const hasPrevious = !! previous?.length;
	const value = total( primary, field );
	const isMissing = value === null && !! noDataLabel;
	// A comparison of real zeros draws nothing either (the chart's empty rule), so the reason shows.
	const previousHasReading = !! previous?.some(
		point => ! point.missing && point.value != null && point.value !== 0
	);

	return {
		key: field,
		label,
		value: isMissing ? null : ( value ?? 0 ),
		previousValue: hasComparisonRows ? total( comparison, field ) : undefined,
		current: toPoints( primary, field, zone, pendingLabel, drawMissingAtZero ),
		previous: hasPrevious ? previous : undefined,
		...( hasPrevious && periodStarts ? { previousAligned: true } : {} ),
		dataFormat,
		countLabel,
		...( isMissing && ! previousHasReading ? { unavailable: noDataLabel } : {} ),
	};
}

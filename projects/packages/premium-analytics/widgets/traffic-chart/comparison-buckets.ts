/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { toDay } from '@jetpack-premium-analytics/widgets-toolkit';
import { format, parseISO, subYears } from 'date-fns';
import type { ReportParams, StatsVisitsResponse } from '@jetpack-premium-analytics/data';

/**
 * A bucket's own span: `date` is where it starts, `endDate` its last instant.
 */
export type BucketSpan = {
	date?: Date;
	endDate?: Date;
};

function overlapMs( primary: BucketSpan, comparison: BucketSpan, offsetMs: number ): number {
	if ( ! primary.date || ! primary.endDate || ! comparison.date || ! comparison.endDate ) {
		return 0;
	}

	const start = Math.max( primary.date.getTime(), comparison.date.getTime() + offsetMs );
	const end = Math.min( primary.endDate.getTime(), comparison.endDate.getTime() + offsetMs );

	return Math.max( 0, end - start );
}

/**
 * How many leading comparison buckets to skip so the buckets, paired in order, overlap
 * most. A comparison that crosses one more week, month or year boundary opens with a
 * stub that pairing by index would put under the first current bucket.
 *
 * @param primary    - The current period's buckets, oldest first.
 * @param comparison - The comparison period's buckets, oldest first.
 * @return The number of comparison buckets to skip; 0 when spans are unknown.
 */
export function getComparisonBucketShift(
	primary: readonly BucketSpan[],
	comparison: readonly BucketSpan[]
): number {
	const primaryStart = primary[ 0 ]?.date;
	const comparisonStart = comparison[ 0 ]?.date;

	if ( ! primaryStart || ! comparisonStart ) {
		return 0;
	}

	// The two periods start on their range's first day, since edge buckets are clipped to it.
	const offsetMs = primaryStart.getTime() - comparisonStart.getTime();
	let best = { shift: 0, overlap: -1 };

	// Shift even when the counts match: a stub at each end evens them.
	for ( let shift = 0; shift < comparison.length; shift++ ) {
		const overlap = primary.reduce(
			( total, bucket, index ) =>
				total + overlapMs( bucket, comparison[ index + shift ] ?? {}, offsetMs ),
			0
		);

		if ( overlap > best.overlap ) {
			best = { shift, overlap };
		}
	}

	return best.shift;
}

function yearBefore( value: string | undefined ): string | undefined {
	const day = toDay( value );

	return day ? format( subYears( parseISO( day ), 1 ), 'yyyy-MM-dd' ) : undefined;
}

/**
 * Whether the comparison is the same dates a year earlier, matched at either end: a
 * range starting on the 1st keeps its start but can end on Feb 29 a year back.
 *
 * @param params - The dashboard range and its comparison.
 * @return Whether the comparison is the same dates a year earlier.
 */
export function comparesYearAgo(
	params: Pick< ReportParams, 'from' | 'to' | 'compare_from' | 'compare_to' >
): boolean {
	const start = yearBefore( params.from );
	const end = yearBefore( params.to );

	return (
		( !! start && start === toDay( params.compare_from ) ) ||
		( !! end && end === toDay( params.compare_to ) )
	);
}

function spansOf( report: StatsVisitsResponse, zone: string ): BucketSpan[] {
	return ( report.data ?? [] ).map( point => ( {
		date: resolveBucketStamp( point.date_start, zone ),
		endDate: resolveBucketStamp( point.date_end, zone ),
	} ) );
}

/**
 * The comparison report without the leading buckets no current bucket overlaps, so its
 * buckets pair in order with the current ones. Its summary is left whole for the totals.
 *
 * @param primary    - The current period's report.
 * @param comparison - The comparison period's report, at the same unit.
 * @param zone       - The reports' reporting timezone.
 * @return The comparison report, trimmed when it opens with such a bucket.
 */
export function withoutLeadingComparisonBuckets(
	primary: StatsVisitsResponse | undefined,
	comparison: StatsVisitsResponse | undefined,
	zone: string
): StatsVisitsResponse | undefined {
	if ( ! primary || ! comparison?.data ) {
		return comparison;
	}

	const shift = getComparisonBucketShift( spansOf( primary, zone ), spansOf( comparison, zone ) );

	if ( ! shift ) {
		return comparison;
	}

	// `slice` drops the intersection `data` is typed as, though the rows are unchanged.
	return { ...comparison, data: comparison.data.slice( shift ) as StatsVisitsResponse[ 'data' ] };
}

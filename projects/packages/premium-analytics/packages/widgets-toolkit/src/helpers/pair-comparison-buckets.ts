/**
 * External dependencies
 */
import { readSiteTimestamp } from '@jetpack-premium-analytics/datetime';

/**
 * Where each period starts, as its report was queried: an ISO date or date-time,
 * read as the wall-clock time it names.
 */
export type ComparisonPeriodStarts = {
	current: string;
	comparison: string;
};

type Bucket = { date_start: string; date_end?: string };

type Span = { start: number; end: number };

const DAY_MS = 24 * 60 * 60 * 1000;

// Wall-clock time counted as if it were UTC, so a DST change moves no bucket.
function wallClockMs( value: string | undefined ): number | undefined {
	const timestamp = value ? readSiteTimestamp( value ) : null;

	return timestamp?.isValid ? Date.UTC( ...timestamp.parts ) : undefined;
}

// `date_end` names the bucket's last second.
function spanOf( bucket: Bucket ): Span | undefined {
	const start = wallClockMs( bucket.date_start );
	const last = wallClockMs( bucket.date_end );

	return start === undefined || last === undefined ? undefined : { start, end: last + 1000 };
}

function isSpan( span: Span | undefined ): span is Span {
	return span !== undefined;
}

function overlapMs( current: Span, comparison: Span | undefined, offsetMs: number ): number {
	if ( ! comparison ) {
		return 0;
	}

	const start = Math.max( current.start, comparison.start + offsetMs );
	const end = Math.min( current.end, comparison.end + offsetMs );

	return Math.max( 0, end - start );
}

// Every bucket moves by one shift, so pairs never cross or repeat. Ties keep the
// first shift tried: 0, then 1, -1, 2, -2.
function pairByOverlap( current: Span[], comparison: Span[], offsetMs: number ) {
	const totalAt = ( shift: number ) =>
		current.reduce(
			( total, span, index ) => total + overlapMs( span, comparison[ index + shift ], offsetMs ),
			0
		);
	let best = { shift: 0, overlap: totalAt( 0 ) };

	for ( let step = 1; step < Math.max( current.length, comparison.length ); step++ ) {
		for ( const shift of [ step, -step ] ) {
			const overlap = totalAt( shift );

			if ( overlap > best.overlap ) {
				best = { shift, overlap };
			}
		}
	}

	return current.map( ( span, index ) =>
		overlapMs( span, comparison[ index + best.shift ], offsetMs ) > 0
			? index + best.shift
			: undefined
	);
}

// A repeated start, as a fall-back DST hour may give, pairs in order.
function pairByStart( current: Span[], comparison: Span[], offsetMs: number ) {
	const indexesByStart = new Map< number, number[] >();

	comparison.forEach( ( span, index ) => {
		indexesByStart.set( span.start, [ ...( indexesByStart.get( span.start ) ?? [] ), index ] );
	} );

	return current.map( span => indexesByStart.get( span.start - offsetMs )?.shift() );
}

/**
 * Which comparison bucket each current bucket is compared with: the one covering
 * the same days once the comparison period is moved onto the current one.
 *
 * Calendar cuts can open the two periods with stubs of different lengths, so buckets
 * longer than a day pair by the shift that overlaps them most.
 *
 * @param current      - The current period's buckets, oldest first.
 * @param comparison   - The comparison period's buckets, oldest first.
 * @param periodStarts - Where each period starts.
 * @return For each current bucket, its comparison bucket's index, or undefined for none.
 */
export function pairComparisonBuckets(
	current: readonly Bucket[],
	comparison: readonly Bucket[],
	periodStarts: ComparisonPeriodStarts
): Array< number | undefined > {
	const currentStart = wallClockMs( periodStarts.current );
	const comparisonStart = wallClockMs( periodStarts.comparison );
	const currentSpans = current.map( spanOf );
	const comparisonSpans = comparison.map( spanOf );

	if (
		currentStart === undefined ||
		comparisonStart === undefined ||
		! currentSpans.every( isSpan ) ||
		! comparisonSpans.every( isSpan )
	) {
		return current.map( ( _, index ) => ( index < comparison.length ? index : undefined ) );
	}

	const offsetMs = currentStart - comparisonStart;
	const isDailyOrShorter = [ ...currentSpans, ...comparisonSpans ].every(
		span => span.end - span.start <= DAY_MS
	);

	return isDailyOrShorter
		? pairByStart( currentSpans, comparisonSpans, offsetMs )
		: pairByOverlap( currentSpans, comparisonSpans, offsetMs );
}

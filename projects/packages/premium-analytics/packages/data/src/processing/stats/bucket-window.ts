/**
 * The trim window for quantity-based time-series endpoints — the email
 * timeline's special case, owned end to end by this module. That endpoint
 * resolves its `date` param to a calendar day and returns `quantity` buckets
 * forward from that day's midnight regardless of the time of day the window
 * starts (verified against production), so a mid-day window comes back with
 * leading out-of-window buckets. The query side sizes the request with
 * `windowEndHour` and sends the window through `toStatsBucketWindowParams`;
 * only `sanitizeStatsEmailTimeSeriesResponse` turns those params back into a
 * bucket filter (`createStatsBucketWindowFilter`) and passes it to the shared
 * sanitizer — for every other sanitizer the pair is inert, so range-bounded
 * endpoints (visits, subscribers, wordads) can never be trimmed.
 */

/**
 * External dependencies
 */
import { formatDatePartWithTime, readSiteTimestamp } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { StatsQueryParams } from '../../utils/stats-params';

// One reader decides which timestamp shapes the window supports: bare dates
// and T-separated datetimes, exactly what the stats-params pipeline itself
// carries — getDatePart, which derives day counts upstream, splits on T
// alone, so a space-separated datetime already degrades there and must not
// size or trim a window here either.
function readWindowTimestamp( value: unknown ) {
	const timestamp = typeof value === 'string' ? readSiteTimestamp( value ) : null;

	return timestamp?.isValid && ! timestamp.value.includes( ' ' ) ? timestamp : null;
}

/**
 * The wall-clock hour a window's end names; a bare date, or a value the
 * reader rejects, ends at hour 23.
 *
 * @param value - The window's end timestamp, as the report params carry it.
 * @return The end hour, 0–23.
 */
export function windowEndHour( value?: string ): number {
	const timestamp = readWindowTimestamp( value );

	return timestamp && timestamp.value.includes( 'T' ) ? timestamp.parts[ 3 ] : 23;
}

const padTimePart = ( part: number ) => String( part ).padStart( 2, '0' );

const EDGE_FALLBACKS = {
	start: { time: '00:00:00', seconds: '00' },
	end: { time: '23:59:59', seconds: '59' },
} as const;

// A window bound in the same timezone-naive wall-clock shape the bucket
// labels carry: the value's own date and time parts as written, any offset
// ignored. A bare date widens to its edge's whole-day time; a seconds-less
// time takes the edge's seconds.
function toWindowBound( value: unknown, edge: keyof typeof EDGE_FALLBACKS ) {
	const timestamp = readWindowTimestamp( value );

	if ( ! timestamp ) {
		return undefined;
	}

	const [ year, month, day, hours, minutes, seconds ] = timestamp.parts;
	const datePart = `${ String( year ).padStart( 4, '0' ) }-${ padTimePart(
		month + 1
	) }-${ padTimePart( day ) }`;
	// The reader guarantees these shapes, so the probes only ask what was
	// written: a time at all, and seconds within it.
	const hasTime = timestamp.value.includes( 'T' );
	const hasSeconds = /T\d{2}:\d{2}:\d{2}/.test( timestamp.value );
	const time = hasTime
		? `${ padTimePart( hours ) }:${ padTimePart( minutes ) }:${
				hasSeconds ? padTimePart( seconds ) : EDGE_FALLBACKS[ edge ].seconds
		  }`
		: EDGE_FALLBACKS[ edge ].time;

	return formatDatePartWithTime( datePart, time );
}

// Bucket bounds are comparable against a window bound only in this shape; a
// row whose bounds fall outside it (an unparseable period label echoed back
// verbatim) is kept rather than silently discarded.
const isWallClockStamp = ( value: string ) => /^\d{4}-\d{2}-\d{2}T/.test( value );

export type StatsBucketFilter = ( range: { date_start: string; date_end: string } ) => boolean;

/**
 * The sanitizer-side half of the window contract: turns the
 * `window_start`/`window_end` sanitizer params back into a bucket filter, or
 * `undefined` when the query names no usable window — a missing or invalid
 * bound, and an inverted window (a hand-edited deep link), all mean "keep
 * every bucket" rather than a silently emptied chart.
 *
 * @param query - The sanitizer's merged query params.
 * @return The filter to keep in-window buckets, or `undefined` for no trim.
 */
export function createStatsBucketWindowFilter(
	query?: StatsQueryParams
): StatsBucketFilter | undefined {
	const start = toWindowBound( query?.window_start, 'start' );
	const end = toWindowBound( query?.window_end, 'end' );

	if ( ! start || ! end || start > end ) {
		return undefined;
	}

	// Raw lexicographic comparison — the same rule as the shared sanitizer's
	// compareBucketBounds, never localeCompare (a collation may ignore the
	// separators these bounds carry).
	return range =>
		! isWallClockStamp( range.date_start ) ||
		! isWallClockStamp( range.date_end ) ||
		( range.date_end >= start && range.date_start <= end );
}

/**
 * The query-side half of the window contract: the sanitizer params a
 * windowed query opts into trimming with. Dedicated names, never the generic
 * `start_date`/`end_date` — those reach the shared sanitizer from
 * range-bounded endpoints that must not be trimmed — and stripped from the
 * HTTP request by `statsQueryParamsToApiParams`.
 *
 * @param params            - The query's stats params.
 * @param params.start_date - The window's start timestamp.
 * @param params.end_date   - The window's end timestamp.
 * @return The window pair, or `undefined` when the params name no full window.
 */
export function toStatsBucketWindowParams( params: {
	start_date?: string;
	end_date?: string;
} ): Pick< StatsQueryParams, 'window_start' | 'window_end' > | undefined {
	return params.start_date && params.end_date
		? { window_start: params.start_date, window_end: params.end_date }
		: undefined;
}

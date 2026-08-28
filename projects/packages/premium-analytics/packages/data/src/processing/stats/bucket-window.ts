/**
 * The trim window for quantity-based time-series endpoints — the email
 * timeline's special case, owned end to end by this module.
 *
 * That endpoint returns `quantity` buckets forward from the resolved day's
 * midnight whatever time of day the window starts (verified against
 * production), so a mid-day window comes back with leading out-of-window
 * buckets. Only `sanitizeStatsEmailTimeSeriesResponse` turns these params back
 * into a filter, so range-bounded endpoints can never be trimmed.
 */

/**
 * External dependencies
 */
import { formatDatePartWithTime, readSiteTimestamp } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { StatsQueryParams } from '../../utils/stats-params';

// Bare dates and T-separated datetimes only — getDatePart splits on T alone
// upstream, so a space-separated datetime must degrade here too.
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

// A window bound in the same timezone-naive wall-clock shape the bucket labels
// carry: date and time parts as written, any offset ignored.
function toWindowBound( value: unknown, edge: keyof typeof EDGE_FALLBACKS ) {
	const timestamp = readWindowTimestamp( value );

	if ( ! timestamp ) {
		return undefined;
	}

	const [ year, month, day, hours, minutes, seconds ] = timestamp.parts;
	const datePart = `${ String( year ).padStart( 4, '0' ) }-${ padTimePart(
		month + 1
	) }-${ padTimePart( day ) }`;
	// The reader already constrained the shape, so these only ask what was written.
	const hasTime = timestamp.value.includes( 'T' );
	const hasSeconds = /T\d{2}:\d{2}:\d{2}/.test( timestamp.value );
	const time = hasTime
		? `${ padTimePart( hours ) }:${ padTimePart( minutes ) }:${
				hasSeconds ? padTimePart( seconds ) : EDGE_FALLBACKS[ edge ].seconds
		  }`
		: EDGE_FALLBACKS[ edge ].time;

	return formatDatePartWithTime( datePart, time );
}

// Bucket bounds compare against a window bound only in this shape; a row that
// fails it is kept rather than silently discarded.
const isWallClockStamp = ( value: string ) => /^\d{4}-\d{2}-\d{2}T/.test( value );

export type StatsBucketFilter = ( range: { date_start: string; date_end: string } ) => boolean;

/**
 * The sanitizer-side half of the window contract: the `window_start`/`window_end`
 * params as a bucket filter. A missing, invalid, or inverted window means "keep
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

	// Raw lexicographic comparison, as in compareBucketBounds — never
	// localeCompare, whose collation may ignore these bounds' separators.
	return range =>
		! isWallClockStamp( range.date_start ) ||
		! isWallClockStamp( range.date_end ) ||
		( range.date_end >= start && range.date_start <= end );
}

/**
 * The query-side half of the window contract: the sanitizer params a windowed
 * query opts into trimming with. Dedicated names, never the generic
 * `start_date`/`end_date`, which range-bounded endpoints also send.
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

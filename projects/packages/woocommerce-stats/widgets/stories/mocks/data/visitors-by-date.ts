/**
 * Internal dependencies
 */
import {
	bucketsForWindow,
	count,
	dayIndexOf,
	sessionsPerDay,
	type ReportBucket,
} from './interval-buckets';

/** The share of sessions that come from distinct visitors, so visitors always read below sessions. */
const VISITOR_SHARE = 0.62;

type VisitorTotals = { sessions: number; visitors: number };

/**
 * A bucket's sessions and visitors, on the daily-sessions trend the by-device report uses, so the
 * two session reports share a trend.
 *
 * @param {ReportBucket} bucket - The bucket to total.
 * @return {VisitorTotals} The bucket's totals.
 */
function totalsFor( bucket: ReportBucket ): VisitorTotals {
	const spanDays = dayIndexOf( bucket.date_end ) - bucket.dayIndex + 1;
	const sessions = Math.round( sessionsPerDay( bucket.dayIndex ) * spanDays );

	return { sessions, visitors: Math.round( sessions * VISITOR_SHARE ) };
}

const toRawTotals = ( { sessions, visitors }: VisitorTotals ) => ( {
	active_sessions: count( sessions ),
	visitors: count( visitors ),
} );

/**
 * The sessions-by-date report of a window: one row per interval bucket with its sessions and
 * visitors, and a summary that sums them.
 *
 * @param {URLSearchParams} query - The request's query params (`from`, `to`, `interval`).
 * @return {unknown} The raw report response.
 */
export function buildVisitorsByDateResponse( query: URLSearchParams ): unknown {
	const buckets = bucketsForWindow( query );
	const totals = buckets.map( totalsFor );
	const summary = totals.reduce(
		( total, bucket ) => ( {
			sessions: total.sessions + bucket.sessions,
			visitors: total.visitors + bucket.visitors,
		} ),
		{ sessions: 0, visitors: 0 }
	);

	return {
		data: buckets.map( ( bucket, index ) => ( {
			...toRawTotals( totals[ index ] ),
			date_start: bucket.date_start,
			date_end: bucket.date_end,
			time_interval: bucket.time_interval,
		} ) ),
		summary: {
			...toRawTotals( summary ),
			date_start: buckets[ 0 ]?.date_start ?? '',
			date_end: buckets[ buckets.length - 1 ]?.date_end ?? '',
		},
	};
}

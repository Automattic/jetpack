/**
 * External dependencies
 */
import { addDays, format, isValid, parse } from 'date-fns';

/**
 * The timeline matrix `stats/<opens|clicks>/emails/<postId>?stats_fields=timeline`
 * nests under a `timeline` key. Daily rows are `[ date, <metric>_count ]`;
 * hourly rows are `[ date, hour, <metric>_count ]` (Calypso's
 * parseEmailChartData shapes).
 */
type EmailTimelineRow = [ string, number ] | [ string, number, number ];

/**
 * Deterministic per-bucket count: a weekly-ish wave over a base volume, so the
 * chart reads as a realistic send-decay curve without any randomness (mock data
 * must stay stable across renders).
 *
 * @param metric - Which timeline the bucket belongs to.
 * @param index  - Bucket index, counted back from the most recent bucket.
 * @return The bucket's count.
 */
function emailTimelineCount( metric: 'opens' | 'clicks', index: number ): number {
	const base = metric === 'opens' ? 120 : 14;
	const wave = Math.sin( index / 2.3 ) * ( base / 3 );
	// Older buckets sit closer to the send date, so activity grows with the
	// index (which counts back from the most recent bucket) up to a plateau.
	const decay = base * Math.min( 1, index / 40 + 0.25 );

	return Math.max( 0, Math.round( decay + wave ) );
}

/**
 * Builds a mock email timeline response for the "Email performance" widget. The
 * email timeline endpoint reads `date` as the window start, resolves it to its
 * calendar day, and returns `quantity` periods going forward — hourly buckets
 * anchored on that day's midnight. Mirroring that behaviour keeps a story's
 * chart aligned with its dashboard date range, including the out-of-window
 * buckets the data layer is expected to trim.
 *
 * @param metric      - Which timeline to return.
 * @param requestPath - The request path; `period`, `quantity`, and `date` are read off its query.
 * @return Raw email timeline response.
 */
export function buildEmailTimelineResponse(
	metric: 'opens' | 'clicks',
	requestPath: string
): unknown {
	const query = new URLSearchParams( requestPath.split( '?' )[ 1 ] ?? '' );
	const period = query.get( 'period' ) === 'hour' ? 'hour' : 'day';
	const parsedQuantity = Number.parseInt( query.get( 'quantity' ) ?? '', 10 );
	const quantity = Number.isInteger( parsedQuantity )
		? Math.min( Math.max( parsedQuantity, 1 ), 24 * 90 )
		: 30;
	// Only the date part matters: the endpoint resolves `date` to its calendar
	// day (hourly buckets anchor on that day's midnight whatever time of day it
	// carries), and parsing the part in the runner's own zone keeps the emitted
	// wall-clock labels aligned with the requested day in any browser timezone.
	const dayPart = ( query.get( 'date' ) ?? '' ).match( /^\d{4}-\d{2}-\d{2}/ )?.[ 0 ] ?? '';
	const parsedDay = parse( dayPart, 'yyyy-MM-dd', new Date() );
	const startDay = isValid( parsedDay ) ? parsedDay : new Date();
	const field = metric === 'opens' ? 'opens_count' : 'clicks_count';

	const data: EmailTimelineRow[] = [];

	// Nudge the curve by the window start so a comparison window draws a
	// visibly different (but still deterministic) line than the primary.
	const windowNudge = ( startDay.getDate() % 7 ) * 2;

	for ( let index = 0; index < quantity; index++ ) {
		// Preserve the existing send-decay shape while emitting buckets from
		// the start day forward.
		const count = emailTimelineCount( metric, quantity - 1 - index ) + windowNudge;

		if ( period === 'hour' ) {
			data.push( [
				format( addDays( startDay, Math.floor( index / 24 ) ), 'yyyy-MM-dd' ),
				index % 24,
				count,
			] );
		} else {
			data.push( [ format( addDays( startDay, index ), 'yyyy-MM-dd' ), count ] );
		}
	}

	return {
		timeline: {
			unit: period,
			fields: period === 'hour' ? [ 'date', 'hour', field ] : [ 'date', field ],
			data,
		},
	};
}

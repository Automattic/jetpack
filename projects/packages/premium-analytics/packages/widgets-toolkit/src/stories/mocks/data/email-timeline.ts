/**
 * External dependencies
 */
import { format, isValid, parseISO, subDays, subHours } from 'date-fns';

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
 * generated buckets end at the requested `date` and count back `quantity`
 * periods, mirroring how the real endpoint scopes its window, so the chart
 * always spans the dashboard date range the story requests.
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
	const parsedDate = parseISO( query.get( 'date' ) ?? '' );
	const endDate = isValid( parsedDate ) ? parsedDate : new Date();
	const field = metric === 'opens' ? 'opens_count' : 'clicks_count';

	const data: EmailTimelineRow[] = [];

	for ( let index = quantity - 1; index >= 0; index-- ) {
		const count = emailTimelineCount( metric, index );

		if ( period === 'hour' ) {
			const bucket = subHours( endDate, index );
			data.push( [ format( bucket, 'yyyy-MM-dd' ), bucket.getHours(), count ] );
		} else {
			data.push( [ format( subDays( endDate, index ), 'yyyy-MM-dd' ), count ] );
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

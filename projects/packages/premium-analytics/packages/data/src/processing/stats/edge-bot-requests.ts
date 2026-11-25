/**
 * Internal dependencies
 */
import { toBucketStamp } from '@jetpack-premium-analytics/datetime';
import { safeParseFloat } from '../../utils/parsing';
import { getStatsChartBucketKey } from './chart-buckets';
import { coerceStatsArray, coerceStatsRecord } from './utils';
import type { StatsSanitizerParams } from '../../utils/stats-params';

/** Who sent a request, as the edge classifies it; the four never overlap. */
export const EDGE_REQUEST_SOURCES = [ 'human', 'ai', 'other', 'blocked' ] as const;

export type EdgeRequestSource = ( typeof EDGE_REQUEST_SOURCES )[ number ];

export type StatsEdgeBotRequestsDataPoint = Record< EdgeRequestSource, number > & {
	date_start: string;
	date_end: string;
};

export type StatsEdgeBotRequestsReport = {
	summary: Record< EdgeRequestSource, number >;
	data: StatsEdgeBotRequestsDataPoint[];
};

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function emptyCounts(): Record< EdgeRequestSource, number > {
	return { human: 0, ai: 0, other: 0, blocked: 0 };
}

/** The bucket a `ts` names: its day, or its day and hour. */
function bucketKey( stamp: unknown, hourly: boolean ): string {
	return String( stamp ?? '' )
		.replace( ' ', 'T' )
		.slice( 0, hourly ? 13 : 10 );
}

function toBucketKey( time: number, hourly: boolean ): string {
	return new Date( time ).toISOString().slice( 0, hourly ? 13 : 10 );
}

/**
 * A bucket's first and last second, offset-less like every Stats bucket label.
 *
 * A day keeps its UTC date, which the site's calendar then stands in for. An hour
 * is exact, so it is moved to the wall time it has on the site.
 *
 * @param key    - The bucket's UTC day, or day and hour.
 * @param hourly - Whether the bucket is an hour.
 * @param zone   - The report's timezone.
 * @return The bucket's bounds.
 */
function bucketBounds( key: string, hourly: boolean, zone?: string ) {
	if ( ! hourly ) {
		return { date_start: `${ key }T00:00:00`, date_end: `${ key }T23:59:59` };
	}

	return zone
		? {
				date_start: toBucketStamp( `${ key }:00:00Z`, zone ),
				date_end: toBucketStamp( `${ key }:59:59Z`, zone ),
			}
		: { date_start: `${ key }:00:00`, date_end: `${ key }:59:59` };
}

/**
 * Normalize an `edge-bot-requests` answer of `stats/ua-queries` into one bucket per
 * day or hour of the window, with a total per source.
 *
 * The template returns only the buckets that had requests, as
 * `{ ts, human_requests, ai_requests, other_requests, blocked_requests }`, so
 * the buckets between `start` and the exclusive `end` are filled with zeroes.
 * A bucket that has not started yet is left out: it has no count to show.
 *
 * An hourly request covers whole UTC days around the reader's window, so its hours
 * are cut back to `window_start` and `window_end`. Days fold into the calendar
 * weeks or months `bucket` names.
 *
 * @param response - The endpoint's rows.
 * @param query    - The request params, the trim window and the report's timezone.
 * @return The report.
 */
export function sanitizeStatsEdgeBotRequestsResponse(
	response: unknown,
	query?: Partial< StatsSanitizerParams >
): StatsEdgeBotRequestsReport {
	const hourly = query?.granularity === 'hour';
	const counts = new Map< string, Record< EdgeRequestSource, number > >();

	for ( const item of coerceStatsArray( response ) ) {
		const row = coerceStatsRecord( item );
		const key = bucketKey( row.ts, hourly );
		if ( ! key ) {
			continue;
		}
		const bucket = counts.get( key ) ?? emptyCounts();
		for ( const source of EDGE_REQUEST_SOURCES ) {
			bucket[ source ] += safeParseFloat( row[ `${ source }_requests` ] );
		}
		counts.set( key, bucket );
	}

	const step = hourly ? MS_PER_HOUR : MS_PER_DAY;
	const windowStart = hourly ? Date.parse( String( query?.window_start ) ) : NaN;
	const windowEnd = hourly ? Date.parse( String( query?.window_end ) ) : NaN;
	// The hour the window opens in counts whole, as the edge has no finer bucket.
	const start = Number.isFinite( windowStart )
		? Math.floor( windowStart / step ) * step
		: Date.parse( `${ query?.start }T00:00:00Z` );
	const end = Number.isFinite( windowEnd )
		? windowEnd + 1
		: Date.parse( `${ query?.end }T00:00:00Z` );
	const keys: string[] = [];
	if ( Number.isFinite( start ) && Number.isFinite( end ) ) {
		// The edge's days are UTC days, so a site ahead of UTC asks for one that has not begun.
		const lastStarted = Math.min( end, Date.now() + 1 );
		for ( let time = start; time < lastStarted; time += step ) {
			keys.push( toBucketKey( time, hourly ) );
		}
	} else {
		keys.push( ...[ ...counts.keys() ].sort() );
	}

	const summary = emptyCounts();
	// A fall-back day names two UTC hours by the same wall-clock hour, which the chart
	// could only draw as two points on one instant, so they fold into one bucket.
	const byStart = new Map< string, StatsEdgeBotRequestsDataPoint >();
	for ( const key of keys ) {
		const bucket = counts.get( key ) ?? emptyCounts();
		const bounds = bucketBounds( key, hourly, query?.timezone );
		const seen = byStart.get( bounds.date_start );
		for ( const source of EDGE_REQUEST_SOURCES ) {
			summary[ source ] += bucket[ source ];
			if ( seen ) {
				seen[ source ] += bucket[ source ];
			}
		}
		if ( seen ) {
			seen.date_end = bounds.date_end;
		} else {
			byStart.set( bounds.date_start, { ...bounds, ...bucket } );
		}
	}

	const bucket = hourly ? undefined : query?.bucket;
	const days = [ ...byStart.values() ];

	return { summary, data: bucket ? foldDays( days, bucket ) : days };
}

/** Sum the days of each calendar week or month; a bucket the window cuts keeps only its days. */
function foldDays(
	days: StatsEdgeBotRequestsDataPoint[],
	bucket: 'week' | 'month'
): StatsEdgeBotRequestsDataPoint[] {
	const byKey = new Map< string, StatsEdgeBotRequestsDataPoint >();
	for ( const day of days ) {
		const key = getStatsChartBucketKey( day.date_start.slice( 0, 10 ), bucket );
		const seen = byKey.get( key );
		if ( ! seen ) {
			byKey.set( key, { ...day } );
			continue;
		}
		seen.date_end = day.date_end;
		for ( const source of EDGE_REQUEST_SOURCES ) {
			seen[ source ] += day[ source ];
		}
	}

	return [ ...byKey.values() ];
}

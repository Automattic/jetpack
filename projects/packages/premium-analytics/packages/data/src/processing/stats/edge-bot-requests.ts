/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';
import type { StatsQueryParams } from '../../utils/stats-params';

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

/** A bucket's first and last second, offset-less like every Stats bucket label. */
function bucketBounds( key: string, hourly: boolean ) {
	return hourly
		? { date_start: `${ key }:00:00`, date_end: `${ key }:59:59` }
		: { date_start: `${ key }T00:00:00`, date_end: `${ key }T23:59:59` };
}

/**
 * Normalize an `edge-bot-requests` answer of `stats/ua-queries` into one bucket per
 * day or hour of the window, with a total per source.
 *
 * The template returns only the buckets that had requests, as
 * `{ ts, human_requests, ai_requests, other_requests, blocked_requests }`, so
 * the buckets between `start` and the exclusive `end` are filled with zeroes.
 *
 * @param response - The endpoint's rows.
 * @param query    - The request params.
 * @return The report.
 */
export function sanitizeStatsEdgeBotRequestsResponse(
	response: unknown,
	query?: StatsQueryParams
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

	const start = Date.parse( `${ query?.start }T00:00:00Z` );
	const end = Date.parse( `${ query?.end }T00:00:00Z` );
	const step = hourly ? MS_PER_HOUR : MS_PER_DAY;
	const keys: string[] = [];
	if ( Number.isFinite( start ) && Number.isFinite( end ) ) {
		for ( let time = start; time < end; time += step ) {
			keys.push( toBucketKey( time, hourly ) );
		}
	} else {
		keys.push( ...[ ...counts.keys() ].sort() );
	}

	const summary = emptyCounts();
	const data = keys.map( key => {
		const bucket = counts.get( key ) ?? emptyCounts();
		for ( const source of EDGE_REQUEST_SOURCES ) {
			summary[ source ] += bucket[ source ];
		}
		return { ...bucketBounds( key, hourly ), ...bucket };
	} );

	return { summary, data };
}

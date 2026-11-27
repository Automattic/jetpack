/**
 * External dependencies
 */
import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { resolveReportTimeZone, type ReportTimeZoneParams } from '../utils/report-timezone';
import { EDGE_ROLLUP_MAX_DAYS, edgeWindow } from './edge-window';
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { StatsChartBucketPeriod } from '../processing/stats';
import type { ReportParams } from '../utils/search';

/** The endpoint serves hours and days; weeks and months fold from its days after the request. */
type EdgeGranularity = 'hour' | 'day';

export type StatsEdgeBotRequestsParams = ReportParams &
	ReportTimeZoneParams & {
		/** The bucket to draw. Defaults to days. */
		period?: 'hour' | StatsChartBucketPeriod;
	};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** The most days each table serves; the endpoint answers a longer range with a 400. */
const MAX_DAYS: Record< EdgeGranularity, number > = { hour: 30, day: EDGE_ROLLUP_MAX_DAYS };

function edgeGranularity( params: StatsEdgeBotRequestsParams ): EdgeGranularity {
	return params.period === 'hour' ? 'hour' : 'day';
}

function utcDay( time: number ): string {
	return new Date( time ).toISOString().slice( 0, 10 );
}

/**
 * The UTC days to ask the endpoint for, `end` exclusive, and for hours the instants
 * the reader's window runs between.
 *
 * Days are sent as the site's calendar days, since the edge counts them in UTC.
 * Hours are exact, so their window is the site's own, widened to whole UTC days.
 *
 * @param params - The report window and bucket size.
 * @return The request's bounds, or undefined when the window cannot be read.
 */
function requestWindow( params: StatsEdgeBotRequestsParams ) {
	if ( edgeGranularity( params ) === 'hour' ) {
		const timezone = resolveReportTimeZone( params.timezone );
		const from = toLocalTZ( params.from, timezone ).getTime();
		// A bare date closes at the end of that day, as the daily window reads it.
		const to = toLocalTZ(
			DATE_ONLY.test( params.to ) ? `${ params.to }T23:59:59.999` : params.to,
			timezone
		).getTime();

		return Number.isFinite( from ) && Number.isFinite( to )
			? { start: utcDay( from ), end: utcDay( to + MS_PER_DAY ), from, to }
			: undefined;
	}

	const { start, end } = edgeWindow( params );

	return start && end ? { start, end } : undefined;
}

/**
 * Whether the window is longer than its table serves, so no request is worth sending.
 *
 * @param params - The report window and bucket size.
 * @return True when the endpoint would refuse the range.
 */
export function isEdgeBotRequestsRangeTooLong( params: StatsEdgeBotRequestsParams ): boolean {
	const bounds = requestWindow( params );
	if ( ! bounds ) {
		return false;
	}
	const days = ( Date.parse( bounds.end ) - Date.parse( bounds.start ) ) / MS_PER_DAY;

	return days > MAX_DAYS[ edgeGranularity( params ) ];
}

/**
 * Requests the edge saw per day or hour, split by who sent them.
 *
 * Days come from the pre-aggregated table; hours exist only in the raw one.
 *
 * @param params - The report window and bucket size.
 * @return The query options.
 */
export const statsEdgeBotRequestsQuery = (
	params: StatsEdgeBotRequestsParams
): StatsReportQueryOptions< 'edgeBotRequests' > => {
	const granularity = edgeGranularity( params );
	const bucket = params.period === 'week' || params.period === 'month' ? params.period : undefined;
	const bounds = requestWindow( params );

	return statsProxyQuery( {
		name: 'edge-bot-requests',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: {
			template: 'edge-bot-requests',
			start: bounds?.start,
			end: bounds?.end,
			granularity,
			table: granularity === 'hour' ? 'raw' : 'rollup',
			timezone: params.timezone,
		},
		sanitizerParams:
			bounds && 'from' in bounds
				? {
						window_start: new Date( bounds.from ).toISOString(),
						window_end: new Date( bounds.to ).toISOString(),
					}
				: bucket && { bucket },
		sanitizer: 'edgeBotRequests',
		enabled: !! bounds && ! isEdgeBotRequestsRangeTooLong( params ),
		windowEnd: params.to || null,
	} );
};

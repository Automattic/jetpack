/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { ReportParams } from '../utils/search';

export type StatsEdgeBotRequestsGranularity = 'hour' | 'day';

export type StatsEdgeBotRequestsParams = ReportParams & {
	granularity?: StatsEdgeBotRequestsGranularity;
};

/** The day after a `yyyy-MM-dd`, for the endpoint's exclusive `end`. */
function nextDay( day: string ): string | undefined {
	const time = Date.parse( `${ day }T00:00:00Z` );

	return Number.isFinite( time )
		? new Date( time + 24 * 60 * 60 * 1000 ).toISOString().slice( 0, 10 )
		: undefined;
}

/**
 * Requests the edge saw per day or hour, split by who sent them.
 *
 * Days come from the pre-aggregated table, which serves up to 366 of them; hours
 * exist only in the raw one, which serves 30 days.
 *
 * @param params - The report window and bucket size.
 * @return The query options.
 */
export const statsEdgeBotRequestsQuery = (
	params: StatsEdgeBotRequestsParams
): StatsReportQueryOptions< 'edgeBotRequests' > => {
	const granularity = params.granularity ?? 'day';
	const start = getDatePart( params.from );
	const lastDay = getDatePart( params.to );
	const end = lastDay ? nextDay( lastDay ) : undefined;

	return statsProxyQuery( {
		name: 'edge-bot-requests',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: {
			template: 'edge-bot-requests',
			start,
			end,
			granularity,
			table: granularity === 'hour' ? 'raw' : 'rollup',
		},
		sanitizer: 'edgeBotRequests',
		enabled: !! ( start && end ),
		windowEnd: params.to || null,
	} );
};

/**
 * Internal dependencies
 */
import {
	EDGE_RAW_MAX_DAYS,
	edgeWindow,
	isEdgeWindowTooLong,
	type EdgeScopeParams,
} from './edge-window';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The table a window reads. The pre-aggregated one has no rows for the last two UTC
 * days, so a window ending in them reads the raw one, which the endpoint caps at 30 days.
 *
 * @param start - The window's first day.
 * @param end   - The day after its last, exclusive.
 * @return The table to read.
 */
function edgeTable( start: string, end: string ): 'raw' | 'rollup' {
	const days = ( Date.parse( end ) - Date.parse( start ) ) / MS_PER_DAY;
	const firstMissingRollupDay = new Date( Date.now() - MS_PER_DAY ).toISOString().slice( 0, 10 );

	return end > firstMissingRollupDay && days <= EDGE_RAW_MAX_DAYS ? 'raw' : 'rollup';
}

/**
 * The bots that requested the site, in the template's groups, each with its top bots.
 *
 * @param params - The report window, and the page's path when it is scoped to one.
 * @return The query options.
 */
export const statsBotActivityQuery = (
	params: StatsReportParams & EdgeScopeParams
): StatsReportQueryOptions< 'botActivity' > => {
	const { start, end } = edgeWindow( params );

	return statsProxyQuery( {
		name: 'bot-activity',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: {
			template: 'bot-activity',
			start,
			end,
			table: start && end ? edgeTable( start, end ) : undefined,
			...( params.url ? { url: params.url } : {} ),
		},
		sanitizer: 'botActivity',
		enabled: !! ( start && end ) && ! isEdgeWindowTooLong( params ),
		windowEnd: params.to || null,
	} );
};

/**
 * Internal dependencies
 */
import { edgeWindow, isEdgeWindowTooLong } from './edge-window';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';

/** The half of the bots one request reads: the template takes no value for both. */
export type StatsBotCategory = 'ai' | 'non-ai';

export type StatsBotClassesParams = StatsReportParams & {
	botCategory: StatsBotCategory;
};

/**
 * The bots that requested the site, each with the edge's class for it.
 *
 * Read from the pre-aggregated table, the one that serves a year.
 *
 * @param params - The report window and the half of the bots to read.
 * @return The query options.
 */
export const statsBotClassesQuery = (
	params: StatsBotClassesParams
): StatsReportQueryOptions< 'botClasses' > => {
	const { start, end } = edgeWindow( params );

	return statsProxyQuery( {
		name: 'bot-classes',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: {
			template: 'bot-class-and-name',
			bot_category: params.botCategory,
			start,
			end,
			table: 'rollup',
		},
		sanitizer: 'botClasses',
		enabled: !! ( start && end ) && ! isEdgeWindowTooLong( params ),
		windowEnd: params.to || null,
	} );
};

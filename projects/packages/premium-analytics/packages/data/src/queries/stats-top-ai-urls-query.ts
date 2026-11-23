/**
 * Internal dependencies
 */
import { edgeWindow } from './edge-window';
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { ReportParams } from '../utils/search';

export type StatsTopAiUrlsParams = ReportParams & {
	/** Rows to return; the endpoint defaults to 10 and serves up to 1000. */
	limit?: number;
};

/**
 * The URLs AI bots requested most, read from the pre-aggregated table.
 *
 * @param params - The report window and row count.
 * @return The query options.
 */
export const statsTopAiUrlsQuery = (
	params: StatsTopAiUrlsParams
): StatsReportQueryOptions< 'topAiUrls' > => {
	const { start, end } = edgeWindow( params );

	return statsProxyQuery( {
		name: 'top-ai-urls',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: { template: 'top-ai-urls', start, end, table: 'rollup', limit: params.limit },
		sanitizer: 'topAiUrls',
		enabled: !! ( start && end ),
		windowEnd: params.to || null,
	} );
};

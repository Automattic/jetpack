/**
 * Internal dependencies
 */
import { edgeWindow, isEdgeWindowTooLong } from './edge-window';
import { statsProxyQuery, type StatsReportQueryOptions } from './stats-query';
import type { ReportParams } from '../utils/search';

/**
 * The AI companies whose bots requested the site, each with its bots.
 *
 * Read from the pre-aggregated table, the one that serves a year.
 *
 * @param params - The report window.
 * @return The query options.
 */
export const statsAiProvidersQuery = (
	params: ReportParams
): StatsReportQueryOptions< 'aiProviders' > => {
	const { start, end } = edgeWindow( params );

	return statsProxyQuery( {
		name: 'ai-providers',
		version: '1.1',
		endpoint: 'stats/ua-queries',
		params: { template: 'ai-providers-with-drill', start, end, table: 'rollup' },
		sanitizer: 'aiProviders',
		enabled: !! ( start && end ) && ! isAiProvidersRangeTooLong( params ),
		windowEnd: params.to || null,
	} );
};

/**
 * Whether the window is longer than the pre-aggregated table serves, so no request is worth sending.
 *
 * @param params - The report window.
 * @return True when the endpoint would refuse the range.
 */
export function isAiProvidersRangeTooLong( params: Pick< ReportParams, 'from' | 'to' > ): boolean {
	return isEdgeWindowTooLong( params );
}

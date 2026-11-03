/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';
import { statsVideoPlaysSummaryQuery } from './stats-video-plays-summary-query';

export const statsVideoPlaysQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'video-plays', 'stats/video-plays', params, 'videoPlays', '1.1', undefined, {
		omitParams: [ 'days' ],
	} );

// Complete-stats summaries use the same endpoint and normalized response,
// but need the dedicated legacy-compatible exact-range request.
export const statsVideoPlaysReportQuery = ( params: StatsReportParams ) =>
	params.complete_stats && params.summarize
		? statsVideoPlaysSummaryQuery( params )
		: statsVideoPlaysQuery( params );

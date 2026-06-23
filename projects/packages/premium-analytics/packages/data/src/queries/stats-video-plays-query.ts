/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsVideoPlaysQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'video-plays', 'stats/video-plays', params, 'videoPlays' );

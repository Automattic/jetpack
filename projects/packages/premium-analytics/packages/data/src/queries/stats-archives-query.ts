/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsArchivesQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'archives', 'stats/archives', params, 'archives' );

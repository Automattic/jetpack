/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsFileDownloadsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'file-downloads', 'stats/file-downloads', params, 'fileDownloads' );

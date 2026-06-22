/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsTagsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'tags', 'stats/tags', params, 'tags' );

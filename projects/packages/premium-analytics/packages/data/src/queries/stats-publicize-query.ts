/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsPublicizeQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'publicize', 'stats/publicize', params, 'publicize' );

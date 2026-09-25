/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsClicksQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'clicks', 'stats/clicks', params, 'clicks', '1.1', undefined, {
		omitParams: [ 'days' ],
	} );

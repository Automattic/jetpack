/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsReferrersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'referrers', 'stats/referrers', params, 'referrers', '1.1', undefined, {
		omitParams: [ 'days' ],
	} );

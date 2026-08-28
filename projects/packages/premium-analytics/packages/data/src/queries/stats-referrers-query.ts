/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsReferrersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'referrers', 'stats/referrers', params, 'referrers', '1.1', undefined, {
		// Calypso summarizes explicit ranges with start_date/date rather than the
		// generic Stats `days` parameter. Keep the range query parameters aligned.
		omitParams: [ 'days' ],
	} );

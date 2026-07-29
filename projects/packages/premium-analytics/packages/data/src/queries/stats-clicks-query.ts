/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsClicksQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'clicks', 'stats/clicks', params, 'clicks', '1.1', undefined, {
		// The Clicks endpoint uses start_date + date to delimit custom ranges.
		// Calypso omits the generic day count, and doing the same avoids sending
		// a parameter this endpoint does not accept.
		omitParams: [ 'days' ],
	} );

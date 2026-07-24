/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
import { statsProxyQuery, type StatsReportParams } from './stats-query';

export const statsClicksQuery = ( params: StatsReportParams ) => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const requestParams = { ...statsParams };

	// The Clicks endpoint uses start_date + date to delimit custom ranges.
	// Calypso omits the generic day count, and doing the same avoids sending a
	// parameter this endpoint does not accept.
	delete requestParams.days;

	if ( params.period === undefined ) {
		requestParams.period = 'day';
	}

	if (
		statsParams.summarize === undefined &&
		typeof statsParams.days === 'number' &&
		statsParams.days > 1
	) {
		requestParams.summarize = 1;
	}

	return statsProxyQuery( {
		name: 'clicks',
		version: '1.1',
		endpoint: 'stats/clicks',
		params: requestParams,
		sanitizer: 'clicks',
		enabled: !! ( requestParams.end_date || requestParams.date || requestParams.start_date ),
	} );
};

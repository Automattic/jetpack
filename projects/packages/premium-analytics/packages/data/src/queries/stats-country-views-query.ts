/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsCountryViewsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'country-views', 'stats/country-views', params, 'locations' );

/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsLocationsQuery = (
	params: StatsReportParams & {
		geoMode?: 'country' | 'region' | 'city';
		filter_by_country?: string;
		/** Region name. The endpoint rejects it without `filter_by_country` or in the country geo mode. */
		filter_by_region?: string;
	}
) => {
	const geoMode = params.geoMode ?? 'country';
	const { filter_by_country, filter_by_region } = params;

	// The filters are endpoint-specific params that reportParamsToStatsQueryParams
	// would strip (it only forwards a fixed allow-list). Pass them via extraParams so
	// they survive the conversion and reach the proxy request.
	return statsReportQuery(
		`locations-${ geoMode }`,
		`stats/location-views/${ geoMode }`,
		params,
		'locations',
		'1.1',
		{
			...( filter_by_country ? { filter_by_country } : {} ),
			...( filter_by_region ? { filter_by_region } : {} ),
		},
		{ omitParams: [ 'days' ] }
	);
};

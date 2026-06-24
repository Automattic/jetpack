/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsLocationsQuery = (
	params: StatsReportParams & {
		geoMode?: 'country' | 'region' | 'city';
		filter_by_country?: string;
	}
) => {
	const geoMode = params.geoMode ?? 'country';
	const { filter_by_country } = params;

	// filter_by_country is an endpoint-specific param that reportParamsToStatsQueryParams
	// would strip (it only forwards a fixed allow-list). Pass it via extraParams so it
	// survives the conversion and reaches the proxy request.
	return statsReportQuery(
		`locations-${ geoMode }`,
		`stats/location-views/${ geoMode }`,
		params,
		'locations',
		'1.1',
		filter_by_country ? { filter_by_country } : undefined
	);
};

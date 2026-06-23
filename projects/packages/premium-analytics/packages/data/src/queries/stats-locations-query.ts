/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

export const statsLocationsQuery = (
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' }
) => {
	const geoMode = params.geoMode ?? 'country';

	return statsReportQuery(
		`locations-${ geoMode }`,
		`stats/location-views/${ geoMode }`,
		params,
		'locations'
	);
};

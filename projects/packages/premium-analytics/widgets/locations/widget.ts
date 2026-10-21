export type LocationsAttributes = {
	geoGranularity?: 'country' | 'region' | 'city';
};

/**
 * Ported from the Jetpack Stats "Locations" module (`stats/location-views/
 * {country|region|city}` via the PA proxy). GeoChart `provinces` resolution is
 * unavailable for some countries, so those fall back to the country-level world map.
 */
export default {
	example: {
		attributes: {
			geoGranularity: 'country',
		},
	},
};

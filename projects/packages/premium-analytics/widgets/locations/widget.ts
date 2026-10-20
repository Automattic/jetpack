/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { getLocationsGeoModeOptions } from '@jetpack-premium-analytics/widgets-toolkit';

export type LocationsAttributes = {
	geoGranularity?: 'country' | 'region' | 'city';
};

/**
 * Ported from the Jetpack Stats "Locations" module (`stats/location-views/
 * {country|region|city}` via the PA proxy). GeoChart `provinces` resolution is
 * unavailable for some countries, so those fall back to the country-level world map.
 */
export default {
	attributes: [
		{
			id: 'geoGranularity',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'jpa/select',
			elements: getLocationsGeoModeOptions(),
			relevance: 'high',
		},
	] as WidgetAttributeField< LocationsAttributes >[],
	example: {
		attributes: {
			geoGranularity: 'country',
		},
	},
};

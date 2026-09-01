/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

export type LocationsAttributes = {
	geoGranularity?: 'country' | 'region' | 'city';
};

/**
 * Ported from the Jetpack Stats "Locations" module (`stats/location-views/
 * {country|region|city}` via the PA proxy). GeoChart `provinces` resolution is
 * unavailable for some countries, so those fall back to the country-level world map.
 */
export default {
	icon: mapMarker,
	attributes: [
		{
			id: 'geoGranularity',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Countries', 'jetpack-premium-analytics-pkg' ),
					value: 'country',
				},
				{
					label: __( 'Regions', 'jetpack-premium-analytics-pkg' ),
					value: 'region',
				},
				{
					label: __( 'Cities', 'jetpack-premium-analytics-pkg' ),
					value: 'city',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< LocationsAttributes >[],
	example: {
		attributes: {
			geoGranularity: 'country',
		},
	},
};

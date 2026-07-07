/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';

export type LocationsAttributes = {
	max?: number;
	geoMode?: 'country' | 'city';
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Locations" module. v1 ships Countries mode
 * (with region drill-down) and Cities mode via the `location-views/{geoMode}`
 * endpoint. Cities are shown as marker locations on the map.
 *
 * Data: fetched via the PA proxy at `stats/location-views/{country|region|city}`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date
 * picker).
 *
 * Known limitation: Google GeoChart `provinces` resolution is unavailable for
 * some countries/territories (e.g. Singapore, Taiwan); those fall back to
 * highlighting the country on the world map.
 */
export default {
	name: 'jpa/locations',
	title: __( 'Locations', 'jetpack-premium-analytics' ),
	icon: mapMarker,
	attributes: [
		{
			id: 'geoMode',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			relevance: 'high',
			elements: [
				{ label: __( 'Countries', 'jetpack-premium-analytics' ), value: 'country' },
				{ label: __( 'Cities', 'jetpack-premium-analytics' ), value: 'city' },
			],
		},
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	],
	example: {
		attributes: {
			geoMode: 'country',
			max: 10,
		},
	},
};

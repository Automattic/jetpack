/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type LocationsAttributes = {
	max?: number;
	geoGranularity?: 'country' | 'city';
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Locations" module. v1 ships Countries mode
 * (with region drill-down) and Cities mode via the `location-views/{geoMode}`
 * endpoint.
 *
 * Data: fetched via the PA proxy at `stats/location-views/{country|region|city}`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date
 * picker).
 *
 * Known limitation: Google GeoChart `provinces` resolution is unavailable for
 * some territories (e.g. Taiwan); those fall back to the world map without
 * regional detail.
 */
export default {
	name: 'jpa/locations',
	title: __( 'Locations', 'jetpack-premium-analytics' ),
	icon: mapMarker,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'geoGranularity',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Countries', 'jetpack-premium-analytics' ),
					value: 'country',
				},
				{
					label: __( 'Cities', 'jetpack-premium-analytics' ),
					value: 'city',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< LocationsAttributes >[],
	example: {
		attributes: {
			max: 10,
			geoGranularity: 'country',
		},
	},
};

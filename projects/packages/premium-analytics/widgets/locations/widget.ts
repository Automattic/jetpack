/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';

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
 * Known limitations: delta/comparison rows all show 0 (follow-up). Google
 * GeoChart `provinces` resolution is unavailable for some territories (e.g.
 * Taiwan); those fall back to the world map without regional detail.
 */
export default {
	name: 'jpa/locations',
	title: __( 'Locations', 'jetpack-premium-analytics' ),
	icon: mapMarker,
	presentation: 'full-bleed',
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};

/**
 * WordPress dependencies
 */
import { mapMarker } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Locations" module. v1 ships Countries mode
 * (with region drill-down) and Cities mode via the `location-views/{geoMode}`
 * endpoint — see README for details and known limitations.
 */
export default {
	name: 'jpa/locations',
	title: 'Locations',
	icon: mapMarker,
	presentation: 'full-bleed',
	attributes: [
		{
			id: 'max',
			label: 'Number of results',
			type: 'integer',
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};

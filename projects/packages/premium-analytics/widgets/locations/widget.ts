/**
 * WordPress dependencies
 */
import { mapMarker } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Locations" module. v1 is country-level only;
 * the region/city tabs and the country filter from the source module are a
 * follow-up (they require the `location-views/{geoMode}` endpoint — see README).
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

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
	presentation: 'framed',
	attributes: [
		{
			id: 'range',
			label: 'Date range',
			type: 'text',
			elements: [
				{ label: 'Today', value: 'today' },
				{ label: 'Last 7 days', value: 'last-7-days' },
				{ label: 'Last 30 days', value: 'last-30-days' },
				{ label: 'Last year', value: 'last-year' },
			],
		},
		{
			id: 'max',
			label: 'Number of countries',
			type: 'integer',
		},
	],
	example: {
		attributes: {
			range: 'last-30-days',
			max: 10,
		},
	},
};

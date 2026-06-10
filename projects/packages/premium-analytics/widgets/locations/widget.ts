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
			id: 'period',
			label: 'Period',
			type: 'text',
			elements: [
				{ label: 'Day', value: 'day' },
				{ label: 'Week', value: 'week' },
				{ label: 'Month', value: 'month' },
				{ label: 'Year', value: 'year' },
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
			period: 'day',
			max: 10,
		},
	},
};

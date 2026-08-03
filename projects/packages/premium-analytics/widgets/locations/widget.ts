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
	max?: number;
	geoGranularity?: 'country' | 'city';
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Locations" module. v1 ships Countries mode
 * (with region drill-down) and Cities mode via the `location-views/{geoMode}`
 * endpoint. City rows are listed in the leaderboard and summarized on the map
 * by country.
 *
 * Data: fetched via the PA proxy at `stats/location-views/{country|region|city}`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date
 * picker).
 *
 * Known limitation: Google GeoChart `provinces` resolution is unavailable for
 * some countries/territories; unsupported region maps fall back at runtime to
 * highlighting the country on the world map.
 */
export default {
	icon: mapMarker,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
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
					label: __( 'Cities', 'jetpack-premium-analytics-pkg' ),
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

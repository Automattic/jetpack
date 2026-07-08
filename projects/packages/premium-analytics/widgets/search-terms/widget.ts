/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type SearchTermsAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;
};

/**
 * Widget type definition for the Search Terms widget.
 *
 * Ported from the Jetpack Stats "Search Terms" module. Displays the top search
 * queries visitors used to reach the site, ranked by view count.
 *
 * Data: fetched via the PA proxy at `stats/search-terms`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date picker).
 */
export default {
	name: 'jpa/search-terms',
	title: __( 'Search Terms', 'jetpack-premium-analytics' ),
	icon: search,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< SearchTermsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};

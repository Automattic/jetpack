/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';

export interface SearchTermsAttributes {
	max?: number;
}

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
			type: 'integer' as const,
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};

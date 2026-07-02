/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Configurable attributes for the Clicks widget.
 */
export type ClicksAttributes = {
	/**
	 * Maximum rows to display. 0 means all rows returned by the API.
	 */
	max?: number;
};

/**
 * Clicks widget type definition.
 *
 * Shows the most-clicked external links for the selected dashboard date range
 * via the PA proxy at `stats/clicks`.
 */
export default {
	name: 'jpa/clicks',
	title: __( 'Clicks', 'jetpack-premium-analytics' ),
	icon: chartBar,
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

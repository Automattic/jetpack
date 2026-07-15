/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';

/**
 * Configurable attributes for the Referrers widget.
 */
export type ReferrersAttributes = {
	/**
	 * Maximum rows to display. 0 means all rows returned by the API.
	 */
	max?: number;
};

/**
 * Referrers widget type definition.
 *
 * Shows the websites and search engines referring visitors for the selected
 * dashboard date range via the PA proxy at `stats/referrers`.
 */
export default {
	name: 'jpa/referrers',
	title: __( 'Referrers', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Websites referring visitors sorted by most clicked. Learn about where your audience comes from.',
			'jetpack-premium-analytics'
		),
	},
	icon: globe,
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

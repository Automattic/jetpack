/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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
	icon: globe,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< ReferrersAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};

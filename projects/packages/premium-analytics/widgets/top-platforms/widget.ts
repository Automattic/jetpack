/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Widget attributes shape.
 *
 * @property max - Maximum rows to display (0 = all). Defaults to 10.
 */
export type TopPlatformsAttributes = {
	max?: number;
};

/**
 * Top Platforms widget type definition.
 *
 * Shows Browser and OS breakdown as a ranked leaderboard. The active
 * dimension (browser / platform) is controlled by a runtime dropdown,
 * not stored as a widget attribute.
 */
export default {
	name: 'jpa/top-platforms',
	title: __( 'Top Platforms', 'jetpack-premium-analytics' ),
	icon: chartBar,
	attributes: [
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	] as WidgetAttributeField< TopPlatformsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};

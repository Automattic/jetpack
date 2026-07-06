/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type TopPlatformsAttributes = {
	/**
	 * Maximum rows to display (0 = all). Defaults to 10.
	 */
	max?: number;
	/**
	 * Device dimension to rank: browsers or operating systems.
	 */
	platformDimension?: 'browser' | 'platform';
};

/**
 * Top Platforms widget type definition.
 *
 * Shows Browser and OS breakdown as a ranked leaderboard. The active
 * dimension is the `platformDimension` attribute (`relevance: 'high'`),
 * so the widget host renders its control.
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
		{
			id: 'platformDimension',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Browser', 'jetpack-premium-analytics' ),
					value: 'browser',
				},
				{
					label: __( 'OS', 'jetpack-premium-analytics' ),
					value: 'platform',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPlatformsAttributes >[],
	example: {
		attributes: {
			max: 10,
			platformDimension: 'browser',
		},
	},
};

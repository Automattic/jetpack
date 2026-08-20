/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

export type TopPlatformsAttributes = {
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
	icon: desktop,
	attributes: [
		{
			id: 'platformDimension',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Browser', 'jetpack-premium-analytics-pkg' ),
					value: 'browser',
				},
				{
					label: __( 'OS', 'jetpack-premium-analytics-pkg' ),
					value: 'platform',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPlatformsAttributes >[],
	example: {
		attributes: {
			platformDimension: 'browser',
		},
	},
};

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
	 * Maximum rows to display (0 = all). Defaults to 10.
	 */
	max?: number;
	/**
	 * Device dimension to rank: screen sizes, browsers, or operating systems.
	 */
	platformDimension?: 'screensize' | 'browser' | 'platform';
};

/**
 * Top Platforms widget type definition.
 *
 * Shows the Size, Browser, and OS breakdowns as a ranked leaderboard — the
 * three properties `stats/devices/{property}` exposes. The active dimension is
 * the `platformDimension` attribute (`relevance: 'high'`), so the widget host
 * renders its control.
 *
 * Size is the odd one out: WPCOM returns it as percentage shares while the
 * other two are view counts, so it is formatted as a percentage.
 */
export default {
	icon: desktop,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
		{
			id: 'platformDimension',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			// Browser stays first: `SelectField` shows the first element when the
			// attribute is unset, so it has to match the render default.
			elements: [
				{
					label: __( 'Browser', 'jetpack-premium-analytics-pkg' ),
					value: 'browser',
				},
				{
					label: __( 'OS', 'jetpack-premium-analytics-pkg' ),
					value: 'platform',
				},
				{
					label: __( 'Size', 'jetpack-premium-analytics-pkg' ),
					value: 'screensize',
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

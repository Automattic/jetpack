/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';

/**
 * Widget attributes shape.
 *
 * @property utmParam - UTM dimension to break down by. Defaults to 'utm_source,utm_medium'.
 * @property max      - Maximum rows to display (0 = all). Defaults to 10.
 */
export type UtmInsightsAttributes = {
	utmParam?: StatsUtmParam;
	max?: number;
};

/**
 * UTM Insights widget type definition.
 *
 * Shows traffic breakdown by UTM parameter via the PA proxy at
 * `stats/utm/{utmParam}`. The active dimension is stored in widget
 * attributes so it persists per widget instance across sessions.
 * Date range comes from WidgetRoot's reportParams (the shared
 * dashboard date picker).
 */
export default {
	name: 'jpa/utm-insights',
	title: __( 'UTM Insights', 'jetpack-premium-analytics' ),
	icon: trendingUp,
	attributes: [
		{
			id: 'utmParam',
			label: __( 'UTM parameter', 'jetpack-premium-analytics' ),
			type: 'string',
		},
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	],
	example: {
		attributes: {
			utmParam: 'utm_source,utm_medium',
			max: 10,
		},
	},
};

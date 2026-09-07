/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';

/**
 * Lifetime totals the widget can show, in display order. Renaming an id
 * breaks the Insights default layout silently: `dashboard-layout.php`
 * hardcodes a subset, and `render.tsx` filters ids it doesn't know.
 */
export const ALL_TIME_STATS_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'posts', label: __( 'Posts', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one total tile.
 * Each id doubles as the summary field the tile reads.
 */
export type AllTimeStatsMetricId = ( typeof ALL_TIME_STATS_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the All-time stats widget. The site summary is
 * all-time, so `useStatsSite()` is queried without the dashboard date range.
 */
export type AllTimeStatsAttributes = {
	metrics?: AllTimeStatsMetricId[];
};

export const DEFAULT_ALL_TIME_STATS_METRICS: AllTimeStatsMetricId[] = ALL_TIME_STATS_METRICS.map(
	metric => metric.id
);

/**
 * Ported from the Jetpack Stats "All-time stats" card. `example.attributes`
 * doubles as the defaults applied to new instances.
 */
export default {
	icon: trendingUp,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics-pkg' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: ALL_TIME_STATS_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< AllTimeStatsAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_ALL_TIME_STATS_METRICS,
		},
	},
};

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
 * The lifetime totals the widget can show, in display order: the persisted id
 * and label of each metric. Single source for the settings checkboxes and the
 * rendered tiles so the two cannot drift apart; `render.tsx` maps the ids to
 * icons and summary fields.
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
 * Configurable attributes for the All-time stats widget. The widget does not
 * read the dashboard date range: the site summary is all-time, so
 * `useStatsSite()` is queried without report params. Host-injected
 * `attributes.reportParams` still flow into WidgetRoot for parity with the
 * other Stats widgets.
 */
export type AllTimeStatsAttributes = {
	/**
	 * Lifetime totals to show in the widget body.
	 */
	metrics?: AllTimeStatsMetricId[];
};

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_ALL_TIME_STATS_METRICS: AllTimeStatsMetricId[] = ALL_TIME_STATS_METRICS.map(
	metric => metric.id
);

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "All-time stats" card: a grid of metric tiles
 * for lifetime totals — views, visitors, posts, and comments. `example.attributes`
 * doubles as the defaults applied to new instances: every metric enabled.
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

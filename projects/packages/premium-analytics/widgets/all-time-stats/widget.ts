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
 * rendered rows so the two cannot drift apart; `render.tsx` maps the ids to
 * icons and summary fields.
 */
export const ALL_TIME_STATS_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
	{ id: 'posts', label: __( 'Posts', 'jetpack-premium-analytics' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one total row.
 * Each id doubles as the summary field the row reads.
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
 * Ported from the Jetpack Stats "All-time stats" card: a labelled list of
 * lifetime totals — views, visitors, posts, and comments. `example.attributes`
 * doubles as the defaults applied to new instances: every metric enabled.
 */
export default {
	name: 'jpa/all-time-stats',
	title: __( 'All-time stats', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Lifetime totals for your site — views, visitors, posts, and comments.',
			'jetpack-premium-analytics'
		),
	},
	icon: trendingUp,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';

/**
 * Identifier persisted in the widget's `metrics` attribute for each metric
 * tile the widget can show.
 */
export type SiteOverviewMetricId = 'views' | 'visitors' | 'likes' | 'comments';

/**
 * Configurable attributes for the Site overview widget. The date range and
 * comparison state come from report params via `useWidgetRootContext()`, not
 * from attributes.
 */
export type SiteOverviewAttributes = {
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics?: SiteOverviewMetricId[];
};

/**
 * The metric tiles the widget can show, in display order. Single source for
 * the settings checkboxes and the rendered tiles so the two cannot drift
 * apart; `render.tsx` maps the ids to icons and summary-response fields.
 */
export const SITE_OVERVIEW_METRICS: { id: SiteOverviewMetricId; label: string }[] = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ) },
];

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_SITE_OVERVIEW_METRICS: SiteOverviewMetricId[] = SITE_OVERVIEW_METRICS.map(
	metric => metric.id
);

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Site overview" card: the period's headline
 * traffic and engagement totals with period-over-period comparison.
 * The `metrics` attribute (`relevance: 'high'`) selects which metric tiles
 * render; `example.attributes` doubles as the defaults applied to new
 * instances: every metric enabled.
 */
export default {
	name: 'jpa/site-overview',
	title: __( 'Site overview', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Views, visitors, likes, and comments for the selected period, with period-over-period change.',
			'jetpack-premium-analytics'
		),
	},
	icon: globe,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: SITE_OVERVIEW_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< SiteOverviewAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_SITE_OVERVIEW_METRICS,
		},
	},
};

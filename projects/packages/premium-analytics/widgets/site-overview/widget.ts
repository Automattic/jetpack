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
	metrics?: SiteOverviewMetricId[];
};

/**
 * The metric tiles the widget can show, in display order. `render.tsx` maps the
 * ids to icons and summary-response fields.
 */
export const SITE_OVERVIEW_METRICS: { id: SiteOverviewMetricId; label: string }[] = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics-pkg' ) },
];

export const DEFAULT_SITE_OVERVIEW_METRICS: SiteOverviewMetricId[] = SITE_OVERVIEW_METRICS.map(
	metric => metric.id
);

/**
 * Ported from the Jetpack Stats "Site overview" card. `example.attributes`
 * doubles as the defaults applied to new instances.
 */
export default {
	icon: globe,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics-pkg' ),
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Site overview widget: one visibility toggle
 * per metric tile. Mirrors the `attributes` declared on the widget definition
 * below; the host renders them as checkboxes and passes the selected values
 * through to `render.tsx`. The date range and comparison state come from report
 * params via `useWidgetRootContext()`, not from attributes.
 */
export type SiteOverviewAttributes = {
	/**
	 * Whether the Views tile is shown.
	 */
	showViews?: boolean;
	/**
	 * Whether the Visitors tile is shown.
	 */
	showVisitors?: boolean;
	/**
	 * Whether the Likes tile is shown.
	 */
	showLikes?: boolean;
	/**
	 * Whether the Comments tile is shown.
	 */
	showComments?: boolean;
};

/**
 * The metric tiles the widget can show, in display order: the visibility
 * attribute id of each metric and its label. Single source for the settings
 * checkboxes and the rendered tiles so the two cannot drift apart; `render.tsx`
 * maps the ids to icons and summary-response fields.
 */
export const SITE_OVERVIEW_METRICS = [
	{ id: 'showViews', label: __( 'Views', 'jetpack-premium-analytics' ) },
	{ id: 'showVisitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
	{ id: 'showLikes', label: __( 'Likes', 'jetpack-premium-analytics' ) },
	{ id: 'showComments', label: __( 'Comments', 'jetpack-premium-analytics' ) },
] as const satisfies readonly { id: keyof SiteOverviewAttributes; label: string }[];

/**
 * The visibility attribute id of one metric tile.
 */
export type SiteOverviewMetricId = ( typeof SITE_OVERVIEW_METRICS )[ number ][ 'id' ];

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Site overview" card: the period's headline
 * traffic and engagement totals with period-over-period comparison.
 * `example.attributes` doubles as the defaults applied to new instances: every
 * metric enabled.
 */
export default {
	name: 'jpa/site-overview',
	title: __( 'Site overview', 'jetpack-premium-analytics' ),
	icon: globe,
	// Each metric defaults to enabled. The `getValue` defaults keep the settings
	// checkbox in sync with the render, which also treats a missing flag as
	// enabled: without them a metric absent from `attributes` would show as an
	// unchecked box while its tile still rendered.
	attributes: SITE_OVERVIEW_METRICS.map( ( { id, label } ) => ( {
		id,
		label,
		type: 'boolean',
		getValue: ( { item }: { item: SiteOverviewAttributes } ) => item[ id ] ?? true,
	} ) ) as WidgetAttributeField< SiteOverviewAttributes >[],
	example: {
		attributes: {
			showViews: true,
			showVisitors: true,
			showLikes: true,
			showComments: true,
		},
	},
};

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Subscriber highlights widget: one visibility
 * toggle per metric tile. Mirrors the `attributes` declared on the widget
 * definition below; the host renders them as checkboxes and passes the selected
 * values through to `render.tsx`. The widget has no date range — the
 * `subscribers/counts` endpoint reports current totals and is not
 * period-scoped.
 */
export type SubscriberHighlightsAttributes = {
	/**
	 * Whether the Total subscribers tile is shown.
	 */
	showTotal?: boolean;
	/**
	 * Whether the Paid subscribers tile is shown.
	 */
	showPaid?: boolean;
	/**
	 * Whether the Free subscribers tile is shown.
	 */
	showFree?: boolean;
	/**
	 * Whether the Social followers tile is shown.
	 */
	showSocial?: boolean;
};

/**
 * The metric tiles the widget can show, in display order: the visibility
 * attribute id of each metric and its label. Single source for the settings
 * checkboxes and the rendered tiles so the two cannot drift apart; `render.tsx`
 * maps the ids to icons and counts fields.
 */
export const SUBSCRIBER_METRICS = [
	{ id: 'showTotal', label: __( 'Total subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'showPaid', label: __( 'Paid subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'showFree', label: __( 'Free subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'showSocial', label: __( 'Social followers', 'jetpack-premium-analytics' ) },
] as const satisfies readonly { id: keyof SubscriberHighlightsAttributes; label: string }[];

/**
 * The visibility attribute id of one metric tile.
 */
export type SubscriberMetricId = ( typeof SUBSCRIBER_METRICS )[ number ][ 'id' ];

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: every
 * metric enabled.
 */
export default {
	name: 'jpa/subscriber-highlights',
	title: __( 'Subscriber highlights', 'jetpack-premium-analytics' ),
	icon: people,
	// Each metric defaults to enabled. The `getValue` defaults keep the settings
	// checkbox in sync with the render, which also treats a missing flag as
	// enabled: without them a metric absent from `attributes` would show as an
	// unchecked box while its tile still rendered.
	attributes: SUBSCRIBER_METRICS.map( ( { id, label } ) => ( {
		id,
		label,
		type: 'boolean',
		getValue: ( { item }: { item: SubscriberHighlightsAttributes } ) => item[ id ] ?? true,
	} ) ) as WidgetAttributeField< SubscriberHighlightsAttributes >[],
	example: {
		attributes: {
			showTotal: true,
			showPaid: true,
			showFree: true,
			showSocial: true,
		},
	},
};

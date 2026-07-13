/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';

/**
 * The metric tiles the widget can show, in display order: the persisted id and
 * label of each metric. Single source for the settings checkboxes and the
 * rendered tiles so the two cannot drift apart; `render.tsx` maps the ids to
 * icons and counts fields.
 */
export const SUBSCRIBER_METRICS = [
	{ id: 'total', label: __( 'Total subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'paid', label: __( 'Paid subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'free', label: __( 'Free subscribers', 'jetpack-premium-analytics' ) },
	{ id: 'social', label: __( 'Social followers', 'jetpack-premium-analytics' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one metric tile.
 */
export type SubscriberMetricId = ( typeof SUBSCRIBER_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the Subscriber highlights widget. The widget has
 * no date range — the `subscribers/counts` endpoint reports current totals and
 * is not period-scoped.
 */
export type SubscriberHighlightsAttributes = {
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics?: SubscriberMetricId[];
};

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_SUBSCRIBER_METRICS: SubscriberMetricId[] = SUBSCRIBER_METRICS.map(
	metric => metric.id
);

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
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: SUBSCRIBER_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< SubscriberHighlightsAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_SUBSCRIBER_METRICS,
		},
	},
};

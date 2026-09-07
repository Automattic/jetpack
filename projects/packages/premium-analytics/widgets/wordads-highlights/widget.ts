/**
 * External dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';
import { __ } from '@wordpress/i18n';
import { megaphone } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Earnings cards the widget can show, in display order. Single source for the
 * settings checkboxes and rendered tiles so the two cannot drift apart.
 */
export const WORDADS_EARNINGS_METRICS = [
	{ id: 'earnings', label: __( 'Earnings', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'paid', label: __( 'Paid', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'outstanding', label: __( 'Outstanding amount', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one earnings card.
 */
export type WordAdsEarningsMetricId = ( typeof WORDADS_EARNINGS_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the WordAds earnings widget. The widget has no
 * date range — the `wordads/earnings` endpoint reports all-time totals and is
 * not period-scoped.
 */
export type WordAdsHighlightsAttributes = {
	/**
	 * Earnings cards to show in the widget body.
	 */
	metrics?: WordAdsEarningsMetricId[];
};

/**
 * Default selection for new widget instances: every card enabled.
 */
export const DEFAULT_WORDADS_EARNINGS_METRICS: WordAdsEarningsMetricId[] =
	WORDADS_EARNINGS_METRICS.map( metric => metric.id );

/**
 * `help` mirrors the Calypso WordAds payout notice (threshold and timing).
 * `example.attributes` doubles as the defaults for new instances.
 */
export default {
	icon: megaphone,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics-pkg' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: WORDADS_EARNINGS_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< WordAdsHighlightsAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_WORDADS_EARNINGS_METRICS,
		},
	},
};

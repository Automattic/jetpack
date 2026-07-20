/**
 * External dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';
import { megaphone } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The earnings cards the widget can show, in display order: the persisted id and
 * label of each metric. Single source for the settings checkboxes and the
 * rendered tiles so the two cannot drift apart; `render.tsx` maps the ids to
 * icons and earnings fields.
 */
export const WORDADS_EARNINGS_METRICS = [
	{ id: 'earnings', label: __( 'Earnings', 'jetpack-premium-analytics' ) },
	{ id: 'paid', label: __( 'Paid', 'jetpack-premium-analytics' ) },
	{ id: 'outstanding', label: __( 'Outstanding amount', 'jetpack-premium-analytics' ) },
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
 * Widget type definition.
 *
 * `help` surfaces as an info popover in the widget header; its copy mirrors the
 * Calypso WordAds payout notice explaining the payout threshold and timing.
 * `example.attributes` doubles as the defaults applied to new instances: every
 * card enabled.
 */
export default {
	name: 'jpa/wordads-highlights',
	title: __( 'WordAds highlights', 'jetpack-premium-analytics' ),
	icon: megaphone,
	help: {
		content: __(
			'Payment is made once your outstanding balance reaches $100, approximately 45 days after the end of the month in which it was earned.',
			'jetpack-premium-analytics'
		),
	},
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
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

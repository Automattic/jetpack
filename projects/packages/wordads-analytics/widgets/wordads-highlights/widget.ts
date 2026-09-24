/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { payment } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Earnings cards the widget shows, in display order.
 */
export const WORDADS_EARNINGS_METRICS = [
	{ id: 'earnings', label: __( 'Earnings', 'jetpack-wordads-analytics-pkg' ) },
	{ id: 'paid', label: __( 'Paid', 'jetpack-wordads-analytics-pkg' ) },
	{ id: 'outstanding', label: __( 'Outstanding amount', 'jetpack-wordads-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

export type WordAdsEarningsMetricId = ( typeof WORDADS_EARNINGS_METRICS )[ number ][ 'id' ];

/**
 * No configurable attributes; the empty record allows host-provided fields. A
 * `metrics` subset persisted by an earlier version is ignored.
 */
export type WordAdsHighlightsAttributes = Record< never, never >;

/**
 * `help` in widget.json mirrors the Calypso WordAds payout notice (threshold and timing).
 */
export default {
	icon: payment,
	attributes: [] as WidgetAttributeField< WordAdsHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};

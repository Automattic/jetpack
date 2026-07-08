/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { currencyDollar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes, and it does not read the
 * dashboard date range: the WordAds earnings endpoint takes no date params and
 * returns cumulative totals plus a full per-period history. Host-injected
 * `attributes.reportParams` still flow into WidgetRoot for parity with the other
 * Stats widgets, but they do not affect what this widget fetches or shows.
 */
export type WordAdsEarningsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "WordAds earnings" screen: headline ad-revenue
 * totals plus a per-period earnings breakdown.
 */
export default {
	name: 'jpa/wordads-earnings',
	title: __( 'WordAds earnings', 'jetpack-premium-analytics' ),
	description: __(
		'Show your WordAds ad revenue: total earnings, amount owed, and a per-period breakdown.',
		'jetpack-premium-analytics'
	),
	icon: currencyDollar,
};

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes; the earnings endpoint is not
 * period-scoped. Typed as `Record< never, never >` so composing it with host
 * fields like `reportParams` in `render.tsx` does not collapse those to `never`.
 */
export type WordAdsEarningsHistoryAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the "Earnings history" table on the Jetpack Stats WordAds page
 * (wp-calypso client/my-sites/stats/wordads/earnings.jsx). Renders the `wordads`
 * breakdown of the `/wordads/earnings` payload. Requires WordAds active on the
 * site.
 */
export default {
	name: 'jpa/wordads-earnings-history',
	title: __( 'Earnings History', 'jetpack-premium-analytics' ),
	description: __(
		'Your WordAds earnings by period, with amounts, ads served, and payment status.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
	attributes: [],
	example: {
		attributes: {},
	},
};

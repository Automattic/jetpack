/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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
	help: {
		content: __(
			'Ads Served is the number of ads we attempted to display (page impressions × available ad slots). Not every ad served results in a paid impression.',
			'jetpack-premium-analytics'
		),
	},
	icon: chartBar,
	attributes: [] as WidgetAttributeField< WordAdsEarningsHistoryAttributes >[],
	example: {
		attributes: {},
	},
};

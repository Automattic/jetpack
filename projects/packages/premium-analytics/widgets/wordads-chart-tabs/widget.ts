/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';

/**
 * The widget accepts no attributes; its date range and bucket size live in the
 * shared URL state.
 */
export type WordAdsChartTabsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Renders ads served, average CPM, and revenue as selectable metric tabs over a
 * line chart. The widget owns its date range because the other Ads widgets are
 * not date-filtered.
 * Requires WordAds to be active on the site.
 */
export default {
	icon: chartBar,
};

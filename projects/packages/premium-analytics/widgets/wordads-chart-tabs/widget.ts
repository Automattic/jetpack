/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes: the date range and bucket
 * size come from the controls the widget renders itself, which write the shared
 * URL search params. Nothing may inject `attributes.reportParams` here —
 * `WidgetRoot` prefers injected attributes over the URL, which would leave the
 * controls writing one source while the chart reads another.
 */
export type WordAdsChartTabsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page). Renders the selected period's ads served,
 * average CPM, and revenue as selectable metric tabs — the upstream page's tab
 * labels and order — over a line chart. The date range and bucket size are the
 * widget's own: the Ads section header offers no date control, because the
 * section's other widgets read an endpoint that takes no dates. Which metric is
 * plotted is the chart's own tab selection.
 * Requires WordAds to be active on the site.
 */
export default {
	icon: chartBar,
};

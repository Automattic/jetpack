/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes: the bucket size follows the
 * dashboard's chart interval control. Report params still reach it through
 * WidgetRoot: the dashboard date range, or `attributes.reportParams` when a
 * host injects them (e.g. Storybook and dashboard previews).
 */
export type WordAdsChartTabsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page). Renders the selected period's ads served,
 * average CPM, and revenue as selectable metric tabs — the upstream page's tab
 * labels and order — over a comparative line chart. The date range, comparison
 * state, and bucket size all come from the dashboard via `reportParams`. Which
 * metric is plotted is the chart's own tab selection.
 * Requires WordAds to be active on the site.
 */
export default {
	icon: chartBar,
};

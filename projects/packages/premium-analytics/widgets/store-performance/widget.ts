/**
 * WordPress dependencies
 */
import { store } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. Report params still reach it
 * through WidgetRoot: the dashboard date range, or `attributes.reportParams`
 * when a host injects them (e.g. Storybook and dashboard previews).
 */
export type StorePerformanceAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/at-a-glance` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Which metric is plotted is the chart's own tab selection, not an attribute.
 */
export default {
	icon: store,
};

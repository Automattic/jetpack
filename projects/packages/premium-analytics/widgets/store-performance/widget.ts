/**
 * WordPress dependencies
 */
import { store } from '@wordpress/icons';

/**
 * No user-configurable attributes; report params still reach it through
 * WidgetRoot from the dashboard date range or an injected `attributes.reportParams`.
 */
export type StorePerformanceAttributes = Record< never, never >;

/**
 * Ported from `woocommerce-analytics/at-a-glance` in woocommerce/woocommerce-analytics.
 * Which metric is plotted is the chart's own tab selection, not an attribute.
 */
export default {
	icon: store,
};

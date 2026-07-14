/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';
import {
	DEFAULT_STORE_PERFORMANCE_METRICS,
	STORE_PERFORMANCE_METRICS,
	type StorePerformanceMetricId,
} from './metrics';

/**
 * Configurable attributes for the Store performance widget. Report params
 * still reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 */
export type StorePerformanceAttributes = {
	/**
	 * Store metrics to show as selectable tabs in the widget body.
	 */
	metrics?: StorePerformanceMetricId[];
};

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/at-a-glance` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * The `metrics` attribute (`relevance: 'high'`) selects which store metrics
 * render as tabs; `example.attributes` doubles as the defaults applied to new
 * instances: every metric enabled.
 */
export default {
	name: 'jpa/store-performance',
	title: __( 'Store performance', 'jetpack-premium-analytics' ),
	help: {
		content: __( 'Shows key store performance metrics at a glance.', 'jetpack-premium-analytics' ),
	},
	icon: store,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: STORE_PERFORMANCE_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< StorePerformanceAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_STORE_PERFORMANCE_METRICS,
		},
	},
};

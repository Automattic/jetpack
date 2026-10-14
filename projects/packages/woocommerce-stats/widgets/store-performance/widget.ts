/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	DEFAULT_STORE_PERFORMANCE_METRICS,
	STORE_PERFORMANCE_METRICS,
	type StorePerformanceMetricId,
} from './metrics';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property metrics - The metrics shown as tabs. Defaults to every metric but Bookings.
 */
export type StorePerformanceAttributes = {
	metrics?: StorePerformanceMetricId[];
};

/**
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/array-checkbox',
			elements: STORE_PERFORMANCE_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
			relevance: 'high',
		},
	] as WidgetAttributeField< StorePerformanceAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_STORE_PERFORMANCE_METRICS,
		},
	},
};

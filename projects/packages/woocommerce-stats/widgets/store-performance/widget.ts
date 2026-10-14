/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getStorePerformanceMetrics, STORE_PERFORMANCE_METRICS } from './metrics';
import type { StorePerformanceMetric } from '../../src/store-performance/metric';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property metrics - The metrics shown as tabs, by id. Absent, every metric on offer shows.
 */
export type StorePerformanceAttributes = {
	metrics?: string[];
};

/**
 * The field options of a list of metrics.
 *
 * @param {StorePerformanceMetric[]} metrics - The metrics.
 * @return {Array} Value and label of each.
 */
function toElements( metrics: StorePerformanceMetric[] ) {
	return metrics.map( metric => ( { value: metric.id, label: metric.label } ) );
}

/**
 * No `example`: a new instance carries no `metrics` and follows the list on offer, which a plugin
 * may add to after this module is evaluated. The field reads that list when it mounts.
 */
export default {
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/array-checkbox',
			relevance: 'high',
			elements: toElements( STORE_PERFORMANCE_METRICS ),
			getElements: () => Promise.resolve( toElements( getStorePerformanceMetrics() ) ),
			getValue: ( { item }: { item: StorePerformanceAttributes } ) =>
				item.metrics ?? getStorePerformanceMetrics().map( metric => metric.id ),
		},
	] as WidgetAttributeField< StorePerformanceAttributes >[],
};

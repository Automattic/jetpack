/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getStorePerformanceMetrics, STORE_PERFORMANCE_METRICS } from './metrics';
import type { StorePerformanceMetric } from '../../src/store-performance/metric';
import type { ChartDisplayChartType } from '@automattic/jetpack-premium-analytics-sdk';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * @property hiddenMetrics - The metrics switched off, by id. The rest of the list on offer shows.
 * @property chartType     - How the selected metric is drawn. Defaults to `line`.
 */
export type StorePerformanceAttributes = {
	hiddenMetrics?: string[];
	chartType?: ChartDisplayChartType;
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
 * The ids on offer, in tab order.
 *
 * @return {string[]} The ids.
 */
function offeredIds() {
	return getStorePerformanceMetrics().map( metric => metric.id );
}

/**
 * The ids on offer but the hidden ones: what the field shows ticked.
 *
 * @param {object} args      - The field arguments.
 * @param {object} args.item - The widget attributes.
 * @return {string[]} The ids shown.
 */
function getValue( { item }: { item: StorePerformanceAttributes } ) {
	const hidden = new Set( item.hiddenMetrics ?? [] );
	return offeredIds().filter( id => ! hidden.has( id ) );
}

/**
 * Write the unticked ids. A hidden id no longer on offer stays, so the choice holds if its
 * plugin comes back.
 *
 * @param {object}   args       - The field arguments.
 * @param {object}   args.item  - The widget attributes.
 * @param {string[]} args.value - The ids ticked.
 * @return {object} The attributes to merge.
 */
function setValue( { item, value }: { item: StorePerformanceAttributes; value: string[] } ) {
	const offered = offeredIds();
	const shown = new Set( value );

	return {
		hiddenMetrics: [
			...( item.hiddenMetrics ?? [] ).filter( id => ! offered.includes( id ) ),
			...offered.filter( id => ! shown.has( id ) ),
		],
	};
}

/**
 * No `example`: a new instance hides nothing and follows the list on offer, which a plugin may add
 * to after this module is evaluated. The field reads that list when it mounts.
 */
export default {
	attributes: [
		{
			id: 'hiddenMetrics',
			label: __( 'Metrics', 'jetpack-woocommerce-stats-pkg' ),
			type: 'jpa/array-checkbox',
			relevance: 'high',
			elements: toElements( STORE_PERFORMANCE_METRICS ),
			getElements: () => Promise.resolve( toElements( getStorePerformanceMetrics() ) ),
			getValue,
			setValue,
		},
	] as WidgetAttributeField< StorePerformanceAttributes >[],
};

/**
 * External dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	useReportConversionRate,
	useReportCustomersByDate,
	useReportOrders,
	useReportVisitors,
} from '../../src/reports';
import {
	STORE_PERFORMANCE_METRICS_FILTER,
	type StorePerformanceMetric,
} from '../../src/store-performance/metric';
import type { DataFormat } from '@automattic/jetpack-premium-analytics-sdk';

const COUNT_FORMAT: DataFormat = { type: 'number', options: { useMultipliers: true, decimals: 0 } };

/**
 * The metrics the widget owns, in tab order. Net sales and Orders read the same report, which the
 * query client runs once.
 */
export const STORE_PERFORMANCE_METRICS: StorePerformanceMetric[] = [
	{
		id: 'net-sales',
		order: 10,
		label: __( 'Net sales', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Monitor your total revenue — after any discounts, returns, or adjustments — over a set period of time.',
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'orders_value_net',
		dataFormat: { type: 'currency', options: { useMultipliers: true } },
		useReport: useReportOrders,
	},
	{
		id: 'orders',
		order: 20,
		label: __( 'Orders', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'See a breakdown of when orders are placed to identify peak selling periods.',
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'orders_no',
		dataFormat: COUNT_FORMAT,
		countLabel: count =>
			/* translators: %s: number of orders. */
			_n( '%s Order', '%s Orders', count, 'jetpack-woocommerce-stats-pkg' ),
		useReport: useReportOrders,
	},
	{
		id: 'visitors',
		order: 30,
		label: __( 'Store visitors', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Store visitors recorded through WooCommerce sessions. Jetpack Stats measures visitors separately, so totals may differ.',
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'visitors',
		dataFormat: COUNT_FORMAT,
		countLabel: count =>
			/* translators: %s: number of store visitors. */
			_n( '%s Store visitor', '%s Store visitors', count, 'jetpack-woocommerce-stats-pkg' ),
		useReport: useReportVisitors,
	},
	{
		id: 'conversion-rate',
		order: 40,
		label: __( 'Store conversion rate', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			"Track your store's conversion funnel from sessions to completed orders.",
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'conversion_rate',
		dataFormat: { type: 'percentage', options: { decimals: 1 } },
		useReport: useReportConversionRate,
		noDataLabel: __( 'No store sessions in this period.', 'jetpack-woocommerce-stats-pkg' ),
	},
	{
		id: 'customers',
		order: 50,
		label: __( 'Customers', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Track the total number of customers (new and returning) who placed orders during the selected time period.',
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'customers',
		dataFormat: COUNT_FORMAT,
		countLabel: count =>
			/* translators: %s: number of customers. */
			_n( '%s Customer', '%s Customers', count, 'jetpack-woocommerce-stats-pkg' ),
		useReport: useReportCustomersByDate,
	},
];

/**
 * Whether a filter entry has every field the widget reads.
 *
 * @param {unknown} candidate - An entry of the filtered list.
 * @return {boolean} Whether it is a metric.
 */
function isStorePerformanceMetric( candidate: unknown ): candidate is StorePerformanceMetric {
	if ( typeof candidate !== 'object' || candidate === null ) {
		return false;
	}
	const metric = candidate as Record< string, unknown >;

	return (
		typeof metric.id === 'string' &&
		metric.id !== '' &&
		( metric.order === undefined || typeof metric.order === 'number' ) &&
		typeof metric.label === 'string' &&
		typeof metric.description === 'string' &&
		typeof metric.field === 'string' &&
		typeof metric.dataFormat === 'object' &&
		metric.dataFormat !== null &&
		typeof metric.useReport === 'function' &&
		( metric.countLabel === undefined || typeof metric.countLabel === 'function' ) &&
		( metric.noDataLabel === undefined || typeof metric.noDataLabel === 'string' )
	);
}

/**
 * A metric's place; one with none goes after every placed one, in registration order.
 *
 * @param {StorePerformanceMetric} metric - The metric.
 * @return {number} Its order.
 */
function tabOrder( metric: StorePerformanceMetric ): number {
	return metric.order ?? Number.MAX_SAFE_INTEGER;
}

/**
 * The metrics on offer: the widget's own, through the filter, by `order`. An entry that is not a
 * metric, or repeats an id, is dropped; a filter that returns no list leaves the widget's own.
 *
 * @return {StorePerformanceMetric[]} The metrics, in tab order.
 */
export function getStorePerformanceMetrics(): StorePerformanceMetric[] {
	const filtered: unknown = applyFilters(
		STORE_PERFORMANCE_METRICS_FILTER,
		STORE_PERFORMANCE_METRICS
	);
	if ( ! Array.isArray( filtered ) ) {
		return STORE_PERFORMANCE_METRICS;
	}

	const seen = new Set< string >();
	return filtered
		.filter( ( metric ): metric is StorePerformanceMetric => {
			if ( ! isStorePerformanceMetric( metric ) || seen.has( metric.id ) ) {
				return false;
			}
			seen.add( metric.id );
			return true;
		} )
		.sort( ( a, b ) => tabOrder( a ) - tabOrder( b ) );
}

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MetricKey } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Identifier persisted in the widget's `metrics` attribute for each
 * selectable store metric.
 */
export type StorePerformanceMetricId =
	| 'net-sales'
	| 'orders'
	| 'bookings'
	| 'visitors'
	| 'conversion-rate'
	| 'customers';

/**
 * A selectable store metric: which report powers it (`metricType`) and which
 * summary/time-series key it reads (`metricKey`).
 */
export type StorePerformanceMetric = {
	id: StorePerformanceMetricId;
	label: string;
	description: string;
	metricType: 'general' | 'booking' | 'visitors' | 'conversion' | 'customers';
	metricKey: MetricKey;
};

/**
 * Canonical metric definitions, in tab display order.
 */
export const STORE_PERFORMANCE_METRICS: StorePerformanceMetric[] = [
	{
		id: 'net-sales',
		label: __( 'Net sales', 'jetpack-premium-analytics' ),
		description: __(
			'Monitor your total revenue — after any discounts, returns, or adjustments — over a set period of time.',
			'jetpack-premium-analytics'
		),
		metricType: 'general',
		metricKey: 'orders_value_net',
	},
	{
		id: 'orders',
		label: __( 'Orders', 'jetpack-premium-analytics' ),
		description: __(
			'See a breakdown of when orders are placed to identify peak selling periods.',
			'jetpack-premium-analytics'
		),
		metricType: 'general',
		metricKey: 'orders_no',
	},
	{
		id: 'bookings',
		label: __( 'Bookings', 'jetpack-premium-analytics' ),
		description: __(
			'See a breakdown of when bookings are placed to identify peak selling periods.',
			'jetpack-premium-analytics'
		),
		metricType: 'booking',
		metricKey: 'orders_no',
	},
	{
		id: 'visitors',
		label: __( 'Visitors', 'jetpack-premium-analytics' ),
		description: __(
			'Track website visitor trends and monitor traffic patterns over time.',
			'jetpack-premium-analytics'
		),
		metricType: 'visitors',
		metricKey: 'visitors',
	},
	{
		id: 'conversion-rate',
		label: __( 'Store conversion rate', 'jetpack-premium-analytics' ),
		description: __(
			"Track your store's conversion funnel from sessions to completed orders.",
			'jetpack-premium-analytics'
		),
		metricType: 'conversion',
		metricKey: 'conversion_rate',
	},
	{
		id: 'customers',
		label: __( 'Customers', 'jetpack-premium-analytics' ),
		description: __(
			'Track the total number of customers (new and returning) who placed orders during the selected time period.',
			'jetpack-premium-analytics'
		),
		metricType: 'customers',
		metricKey: 'customers',
	},
];

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_STORE_PERFORMANCE_METRICS: StorePerformanceMetricId[] =
	STORE_PERFORMANCE_METRICS.map( metric => metric.id );

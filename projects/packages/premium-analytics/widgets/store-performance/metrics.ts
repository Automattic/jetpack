/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { CountLabel, MetricKey } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Identifier of one store metric tab.
 */
export type StorePerformanceMetricId =
	'net-sales' | 'orders' | 'bookings' | 'visitors' | 'conversion-rate' | 'customers';

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
	/** The tooltip's unit, for the metrics that are counts. */
	countLabel?: CountLabel;
};

/**
 * Canonical metric definitions, in tab display order.
 */
export const STORE_PERFORMANCE_METRICS: StorePerformanceMetric[] = [
	{
		id: 'net-sales',
		label: __( 'Net sales', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Monitor your total revenue — after any discounts, returns, or adjustments — over a set period of time.',
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'general',
		metricKey: 'orders_value_net',
	},
	{
		id: 'orders',
		label: __( 'Orders', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'See a breakdown of when orders are placed to identify peak selling periods.',
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'general',
		metricKey: 'orders_no',
		countLabel: count =>
			/* translators: %s: number of orders. */
			_n( '%s Order', '%s Orders', count, 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: 'bookings',
		label: __( 'Bookings', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'See a breakdown of when bookings are placed to identify peak selling periods.',
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'booking',
		metricKey: 'orders_no',
		countLabel: count =>
			/* translators: %s: number of bookings. */
			_n( '%s Booking', '%s Bookings', count, 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: 'visitors',
		label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Track website visitor trends and monitor traffic patterns over time.',
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'visitors',
		metricKey: 'visitors',
		countLabel: count =>
			/* translators: %s: number of visitors. */
			_n( '%s Visitor', '%s Visitors', count, 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: 'conversion-rate',
		label: __( 'Store conversion rate', 'jetpack-premium-analytics-pkg' ),
		description: __(
			"Track your store's conversion funnel from sessions to completed orders.",
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'conversion',
		metricKey: 'conversion_rate',
	},
	{
		id: 'customers',
		label: __( 'Customers', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Track the total number of customers (new and returning) who placed orders during the selected time period.',
			'jetpack-premium-analytics-pkg'
		),
		metricType: 'customers',
		metricKey: 'customers',
		countLabel: count =>
			/* translators: %s: number of customers. */
			_n( '%s Customer', '%s Customers', count, 'jetpack-premium-analytics-pkg' ),
	},
];

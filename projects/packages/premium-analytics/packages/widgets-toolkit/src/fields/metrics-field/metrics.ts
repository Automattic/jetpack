/**
 * External dependencies
 */
import { FilterCondition } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MetricKey } from '../../types';

export type Metric = {
	id: string;
	label: string;
	description?: string;
	category?: 'Finances' | 'Orders' | 'Sales' | 'Inventory';
	metricType: 'general' | 'product' | 'booking' | 'visitors' | 'conversion' | 'customers';
	metricKey: MetricKey;
	filters?: FilterCondition[];
	enabled: boolean;
};

const METRIC_NET_SALES: Metric = {
	id: 'general-orders_value_net',
	label: __( 'Net sales', 'jetpack-premium-analytics' ),
	description: __(
		'Monitor your total revenue — after any discounts, returns, or adjustments — over a set period of time.',
		'jetpack-premium-analytics'
	),
	category: 'Finances',
	metricType: 'general',
	metricKey: 'orders_value_net',
	enabled: true,
};

const METRIC_ORDERS: Metric = {
	id: 'general-orders_no',
	label: __( 'Orders', 'jetpack-premium-analytics' ),
	description: __(
		'See a breakdown of when orders are placed to identify peak selling periods.',
		'jetpack-premium-analytics'
	),
	category: 'Orders',
	metricType: 'general',
	metricKey: 'orders_no',
	enabled: true,
};

const METRIC_BOOKINGS: Metric = {
	id: 'booking-orders_no',
	label: __( 'Bookings', 'jetpack-premium-analytics' ),
	description: __(
		'See a breakdown of when bookings are placed to identify peak selling periods.',
		'jetpack-premium-analytics'
	),
	category: 'Orders',
	metricKey: 'orders_no',
	metricType: 'booking',
	filters: [
		{
			compare: 'IN',
			key: 'product_type',
			value: [ 'booking', 'bookable-event', 'bookable-service' ],
		},
	],
	enabled: true,
};

const METRIC_VISITORS: Metric = {
	id: 'visitors-visitors',
	label: __( 'Visitors', 'jetpack-premium-analytics' ),
	description: __(
		'Track website visitor trends and monitor traffic patterns over time.',
		'jetpack-premium-analytics'
	),
	category: 'Orders',
	metricType: 'visitors',
	metricKey: 'visitors',
	enabled: true,
};

const METRIC_CONVERSION_RATE: Metric = {
	id: 'conversion-conversion_rate',
	label: __( 'Store conversion rate', 'jetpack-premium-analytics' ),
	description: __(
		"Track your store's conversion funnel from sessions to completed orders.",
		'jetpack-premium-analytics'
	),
	category: 'Sales',
	metricType: 'conversion',
	metricKey: 'conversion_rate',
	enabled: true,
};

const METRIC_CUSTOMERS: Metric = {
	id: 'customers-customers',
	label: __( 'Customers', 'jetpack-premium-analytics' ),
	description: __(
		'Track the total number of customers (new and returning) who placed orders during the selected time period.',
		'jetpack-premium-analytics'
	),
	category: 'Orders',
	metricType: 'customers',
	metricKey: 'customers',
	enabled: true,
};

export const DEFAULT_METRICS = [
	METRIC_NET_SALES,
	METRIC_ORDERS,
	METRIC_BOOKINGS,
	METRIC_VISITORS,
	METRIC_CONVERSION_RATE,
	METRIC_CUSTOMERS,
];

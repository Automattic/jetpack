/**
 * External dependencies
 */
import { __, _n } from '@wordpress/i18n';
import type { DataFormat } from '@automattic/jetpack-premium-analytics-sdk';

/**
 * The report a metric reads: the orders report, the orders report of the booking products,
 * or the visitors, conversion rate and customers reports.
 */
export type StorePerformanceSource =
	'orders' | 'bookings' | 'visitors' | 'conversion' | 'customers';

export type StorePerformanceMetric = {
	/** Keys the tab: orders and bookings read the same field of two reports. */
	id: 'net-sales' | 'orders' | 'bookings' | 'visitors' | 'conversion-rate' | 'customers';
	label: string;
	description: string;
	source: StorePerformanceSource;
	/** The field read from the report's summary and from each of its rows. */
	field: string;
	dataFormat: DataFormat;
	countLabel?: ( count: number ) => string;
};

const COUNT_FORMAT: DataFormat = { type: 'number', options: { useMultipliers: true, decimals: 0 } };

/**
 * The metrics, in tab order.
 */
export const STORE_PERFORMANCE_METRICS: StorePerformanceMetric[] = [
	{
		id: 'net-sales',
		label: __( 'Net sales', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Monitor your total revenue — after any discounts, returns, or adjustments — over a set period of time.',
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'orders',
		field: 'orders_value_net',
		dataFormat: { type: 'currency' },
	},
	{
		id: 'orders',
		label: __( 'Orders', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'See a breakdown of when orders are placed to identify peak selling periods.',
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'orders',
		field: 'orders_no',
		dataFormat: { type: 'number' },
		countLabel: count =>
			/* translators: %s: number of orders. */
			_n( '%s Order', '%s Orders', count, 'jetpack-woocommerce-stats-pkg' ),
	},
	{
		id: 'bookings',
		label: __( 'Bookings', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'See a breakdown of when bookings are placed to identify peak selling periods.',
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'bookings',
		field: 'orders_no',
		dataFormat: { type: 'number' },
		countLabel: count =>
			/* translators: %s: number of bookings. */
			_n( '%s Booking', '%s Bookings', count, 'jetpack-woocommerce-stats-pkg' ),
	},
	{
		id: 'visitors',
		label: __( 'Store visitors', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Store visitors recorded through WooCommerce sessions. Jetpack Stats measures visitors separately, so totals may differ.',
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'visitors',
		field: 'visitors',
		dataFormat: COUNT_FORMAT,
		countLabel: count =>
			/* translators: %s: number of store visitors. */
			_n( '%s Store visitor', '%s Store visitors', count, 'jetpack-woocommerce-stats-pkg' ),
	},
	{
		id: 'conversion-rate',
		label: __( 'Store conversion rate', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			"Track your store's conversion funnel from sessions to completed orders.",
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'conversion',
		field: 'conversion_rate',
		dataFormat: { type: 'percentage', options: { decimals: 1 } },
	},
	{
		id: 'customers',
		label: __( 'Customers', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'Track the total number of customers (new and returning) who placed orders during the selected time period.',
			'jetpack-woocommerce-stats-pkg'
		),
		source: 'customers',
		field: 'customers',
		dataFormat: COUNT_FORMAT,
		countLabel: count =>
			/* translators: %s: number of customers. */
			_n( '%s Customer', '%s Customers', count, 'jetpack-woocommerce-stats-pkg' ),
	},
];

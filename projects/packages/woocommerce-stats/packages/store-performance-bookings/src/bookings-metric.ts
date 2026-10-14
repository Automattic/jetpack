/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { BOOKINGS_FILTER, useReportOrders, type ReportParams } from '../../../src/reports';
import {
	STORE_PERFORMANCE_METRICS_FILTER,
	type StorePerformanceMetric,
	type StorePerformanceReport,
} from '../../../src/store-performance/metric';

const FILTER_NAMESPACE = 'jetpack-woocommerce-stats/store-performance-bookings';

/**
 * The orders report of the booking products, under the dashboard's report params.
 *
 * @param {ReportParams} params - The report params.
 * @return {StorePerformanceReport} The report.
 */
function useBookingsReport( params: ReportParams ): StorePerformanceReport {
	return useReportOrders( { ...params, filters: [ BOOKINGS_FILTER ] } );
}

/**
 * The Bookings metric, placed after Orders, built when asked so its strings read the catalog
 * loaded by then.
 *
 * @return {StorePerformanceMetric} The metric.
 */
export function bookingsMetric(): StorePerformanceMetric {
	return {
		id: 'bookings',
		order: 25,
		label: __( 'Bookings', 'jetpack-woocommerce-stats-pkg' ),
		description: __(
			'See a breakdown of when bookings are placed to identify peak selling periods.',
			'jetpack-woocommerce-stats-pkg'
		),
		field: 'orders_no',
		dataFormat: { type: 'number' },
		countLabel: count =>
			/* translators: %s: number of bookings. */
			_n( '%s Booking', '%s Bookings', count, 'jetpack-woocommerce-stats-pkg' ),
		useReport: useBookingsReport,
	};
}

/**
 * Add the Bookings metric to the list on offer; the widget places it by its order.
 *
 * @param {StorePerformanceMetric[]} metrics - The metrics on offer so far.
 * @return {StorePerformanceMetric[]} The metrics with Bookings.
 */
function addBookingsMetric( metrics: StorePerformanceMetric[] ): StorePerformanceMetric[] {
	return Array.isArray( metrics ) ? [ ...metrics, bookingsMetric() ] : metrics;
}

/**
 * Offer the Bookings metric to Store performance.
 */
export function registerBookingsMetric(): void {
	addFilter( STORE_PERFORMANCE_METRICS_FILTER, FILTER_NAMESPACE, addBookingsMetric );
}

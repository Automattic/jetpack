/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useBookingsReport, type ReportParams } from './use-bookings-report';
import type { DataFormat, ReportResult } from '@automattic/jetpack-premium-analytics-sdk';

/** The filter Store performance reads its metrics from. */
export const STORE_PERFORMANCE_METRICS_FILTER = 'jetpack.woocommerceStats.storePerformance.metrics';

/** A metric as Store performance takes it; the widget's own run 10 to 50 by `order`. */
export type StorePerformanceMetric = {
	id: string;
	order?: number;
	label: string;
	description: string;
	field: string;
	dataFormat: DataFormat;
	countLabel?: ( count: number ) => string;
	useReport: ( params: ReportParams ) => ReportResult< unknown >;
};

const FILTER_NAMESPACE = 'jetpack-woocommerce-stats/store-performance-bookings';

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

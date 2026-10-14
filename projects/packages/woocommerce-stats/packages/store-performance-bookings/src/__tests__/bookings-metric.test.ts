/**
 * External dependencies
 */
import { useReport } from '@automattic/jetpack-premium-analytics-sdk';
import { removeFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { BOOKINGS_FILTER } from '../../../../src/reports';
import { STORE_PERFORMANCE_METRICS_FILTER } from '../../../../src/store-performance/metric';
import { getStorePerformanceMetrics } from '../../../../widgets/store-performance/metrics';
import { bookingsMetric, registerBookingsMetric } from '../bookings-metric';
import type { StorePerformanceMetric } from '../../../../src/store-performance/metric';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );

const mockUseReport = useReport as jest.Mock;

const ids = ( metrics: StorePerformanceMetric[] ) => metrics.map( item => item.id );

afterEach( () => {
	jest.clearAllMocks();
	removeFilter(
		STORE_PERFORMANCE_METRICS_FILTER,
		'jetpack-woocommerce-stats/store-performance-bookings'
	);
} );

describe( 'bookingsMetric', () => {
	it( 'reads the orders report of the booking products', () => {
		const params = { from: '2026-06-01', to: '2026-06-07', interval: 'day' };

		bookingsMetric().useReport( params );

		expect( mockUseReport ).toHaveBeenCalledTimes( 1 );
		expect( mockUseReport.mock.calls[ 0 ][ 1 ] ).toEqual( {
			...params,
			filters: [ BOOKINGS_FILTER ],
		} );
	} );
} );

describe( 'registerBookingsMetric', () => {
	it( 'offers Bookings to Store performance after Orders', () => {
		registerBookingsMetric();

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( [
			'net-sales',
			'orders',
			'bookings',
			'visitors',
			'conversion-rate',
			'customers',
		] );
	} );
} );

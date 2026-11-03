/**
 * External dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { STORE_PERFORMANCE_METRICS_FILTER } from '../../../src/store-performance/metric';
import { getStorePerformanceMetrics, STORE_PERFORMANCE_METRICS } from '../metrics';
import type { StorePerformanceMetric } from '../../../src/store-performance/metric';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );

const NAMESPACE = 'test/store-performance';
const OWN_IDS = [ 'net-sales', 'orders', 'visitors', 'conversion-rate', 'customers' ];
const EXTRA: StorePerformanceMetric = {
	id: 'extra',
	label: 'Extra',
	description: 'An extra metric.',
	field: 'extra',
	dataFormat: { type: 'number' },
	useReport: () => ( {} ) as never,
};

const ids = ( metrics: StorePerformanceMetric[] ) => metrics.map( metric => metric.id );

afterEach( () => {
	removeFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE );
} );

describe( 'getStorePerformanceMetrics', () => {
	it( 'offers the widget metrics when nothing is registered', () => {
		expect( ids( getStorePerformanceMetrics() ) ).toEqual( OWN_IDS );
	} );

	it( 'places a metric by its order, and one with none after the placed ones', () => {
		addFilter(
			STORE_PERFORMANCE_METRICS_FILTER,
			NAMESPACE,
			( metrics: StorePerformanceMetric[] ) => [
				{ ...EXTRA, id: 'later' },
				...metrics,
				{ ...EXTRA, id: 'after-orders', order: 25 },
				{ ...EXTRA, id: 'also-after-orders', order: 25 },
				{ ...EXTRA, id: 'first', order: 1 },
			]
		);

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( [
			'first',
			'net-sales',
			'orders',
			'after-orders',
			'also-after-orders',
			'visitors',
			'conversion-rate',
			'customers',
			'later',
		] );
	} );

	it( 'drops an entry that is not a metric or repeats an id', () => {
		addFilter(
			STORE_PERFORMANCE_METRICS_FILTER,
			NAMESPACE,
			( metrics: StorePerformanceMetric[] ) => [
				...metrics,
				{ id: 'broken' },
				{ ...EXTRA, id: 'orders' },
				{ ...EXTRA, id: 'misplaced', order: 'first' as unknown as number },
			]
		);

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( OWN_IDS );
	} );

	it( 'keeps the widget metrics when the filter returns no list', () => {
		addFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE, () => 'nothing' );

		expect( getStorePerformanceMetrics() ).toBe( STORE_PERFORMANCE_METRICS );
	} );
} );

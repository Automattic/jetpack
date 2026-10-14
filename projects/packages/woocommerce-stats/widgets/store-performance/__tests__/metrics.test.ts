/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { STORE_PERFORMANCE_METRICS_FILTER } from '../../../src/store-performance/metric';
import { getStorePerformanceMetrics, STORE_PERFORMANCE_METRICS } from '../metrics';
import { useStorePerformanceMetrics } from '../use-store-performance-metrics';
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

	it( 'offers what the filter returns, in its order', () => {
		addFilter(
			STORE_PERFORMANCE_METRICS_FILTER,
			NAMESPACE,
			( metrics: StorePerformanceMetric[] ) => [ EXTRA, ...metrics ]
		);

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( [ 'extra', ...OWN_IDS ] );
	} );

	it( 'drops an entry that is not a metric or repeats an id', () => {
		addFilter(
			STORE_PERFORMANCE_METRICS_FILTER,
			NAMESPACE,
			( metrics: StorePerformanceMetric[] ) => [
				...metrics,
				{ id: 'broken' },
				{ ...EXTRA, id: 'orders' },
			]
		);

		expect( ids( getStorePerformanceMetrics() ) ).toEqual( OWN_IDS );
	} );

	it( 'keeps the widget metrics when the filter returns no list', () => {
		addFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE, () => 'nothing' );

		expect( getStorePerformanceMetrics() ).toBe( STORE_PERFORMANCE_METRICS );
	} );
} );

describe( 'useStorePerformanceMetrics', () => {
	it( 'reads the filter again when a registrant comes or goes', () => {
		const { result } = renderHook( () => useStorePerformanceMetrics() );
		expect( ids( result.current ) ).toEqual( OWN_IDS );

		act( () => {
			addFilter(
				STORE_PERFORMANCE_METRICS_FILTER,
				NAMESPACE,
				( metrics: StorePerformanceMetric[] ) => [ ...metrics, EXTRA ]
			);
		} );
		expect( ids( result.current ) ).toEqual( [ ...OWN_IDS, 'extra' ] );

		act( () => {
			removeFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE );
		} );
		expect( ids( result.current ) ).toEqual( OWN_IDS );
	} );
} );

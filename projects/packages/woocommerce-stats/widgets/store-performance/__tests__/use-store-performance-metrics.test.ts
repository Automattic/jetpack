/**
 * External dependencies
 */
import { act, render, renderHook } from '@testing-library/react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { createElement, Fragment, useLayoutEffect } from 'react';
/**
 * Internal dependencies
 */
import { STORE_PERFORMANCE_METRICS_FILTER } from '../../../src/store-performance/metric';
import { useStorePerformanceMetrics } from '../use-store-performance-metrics';
import type { StorePerformanceMetric } from '../../../src/store-performance/metric';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );

const NAMESPACE = 'test/store-performance-metrics';
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
const addExtra = () => {
	addFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE, ( metrics: StorePerformanceMetric[] ) => [
		...metrics,
		EXTRA,
	] );
};

afterEach( () => {
	removeFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE );
} );

describe( 'useStorePerformanceMetrics', () => {
	// First on purpose: the gap it covers only exists before the module's first subscription.
	it( 'sees a filter added between its first render and its subscription', () => {
		const Metrics = () =>
			createElement( Fragment, null, ids( useStorePerformanceMetrics() ).join( ' ' ) );
		const LateRegistrant = () => {
			useLayoutEffect( addExtra, [] );
			return null;
		};

		const { container } = render(
			createElement( Fragment, null, createElement( Metrics ), createElement( LateRegistrant ) )
		);

		expect( container ).toHaveTextContent( 'extra' );
	} );

	it( 'reads the filter again when a registrant comes or goes', () => {
		const { result } = renderHook( () => useStorePerformanceMetrics() );
		expect( ids( result.current ) ).toEqual( OWN_IDS );

		act( addExtra );
		expect( ids( result.current ) ).toEqual( [ ...OWN_IDS, 'extra' ] );

		act( () => {
			removeFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE );
		} );
		expect( ids( result.current ) ).toEqual( OWN_IDS );
	} );
} );

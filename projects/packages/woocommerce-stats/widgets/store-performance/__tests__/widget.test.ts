/**
 * External dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { STORE_PERFORMANCE_METRICS_FILTER } from '../../../src/store-performance/metric';
import widget from '../widget';
import type { StorePerformanceMetric } from '../../../src/store-performance/metric';

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( { useReport: jest.fn() } ) );

const NAMESPACE = 'test/store-performance-widget';
const EXTRA: StorePerformanceMetric = {
	id: 'extra',
	label: 'Extra',
	description: 'An extra metric.',
	field: 'extra',
	dataFormat: { type: 'number' },
	useReport: () => ( {} ) as never,
};
const [ field ] = widget.attributes;

afterEach( () => {
	removeFilter( STORE_PERFORMANCE_METRICS_FILTER, NAMESPACE );
} );

describe( 'the hiddenMetrics field', () => {
	it( 'ticks every metric on offer but the hidden ones, a later registrant included', () => {
		addFilter(
			STORE_PERFORMANCE_METRICS_FILTER,
			NAMESPACE,
			( metrics: StorePerformanceMetric[] ) => [ ...metrics, EXTRA ]
		);

		expect( field.getValue?.( { item: { hiddenMetrics: [ 'orders', 'gone' ] } } ) ).toEqual( [
			'net-sales',
			'visitors',
			'conversion-rate',
			'customers',
			'extra',
		] );
	} );

	it( 'writes the unticked ids and keeps a hidden one that is not on offer', () => {
		expect(
			field.setValue?.( {
				item: { hiddenMetrics: [ 'gone' ] },
				value: [ 'net-sales', 'visitors' ],
			} )
		).toEqual( { hiddenMetrics: [ 'gone', 'orders', 'conversion-rate', 'customers' ] } );
	} );
} );

/**
 * Internal dependencies
 */
import { withoutComparison } from '../without-comparison';
import type { ReportParams } from '@jetpack-premium-analytics/data';

const PARAMS = {
	from: '2026-07-01',
	to: '2026-07-31',
	interval: 'day',
} as unknown as ReportParams;

const COMPARING_PARAMS = {
	...PARAMS,
	comp: '1',
	compare_from: '2026-06-01',
	compare_to: '2026-06-30',
	compare_preset: 'previous_period',
} as unknown as ReportParams;

describe( 'withoutComparison', () => {
	it( 'removes every comparison field', () => {
		const result = withoutComparison( COMPARING_PARAMS );

		expect( result ).not.toHaveProperty( 'comp' );
		expect( result ).not.toHaveProperty( 'compare_from' );
		expect( result ).not.toHaveProperty( 'compare_to' );
		expect( result ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'keeps the rest of the params, including widget-specific extras', () => {
		const result = withoutComparison( { ...COMPARING_PARAMS, stat_fields: 'views,visitors' } );

		expect( result ).toEqual( { ...PARAMS, stat_fields: 'views,visitors' } );
	} );

	it( 'leaves params that carry no comparison untouched', () => {
		expect( withoutComparison( PARAMS ) ).toEqual( PARAMS );
	} );

	it( 'does not mutate the input', () => {
		const params = { ...COMPARING_PARAMS };

		withoutComparison( params );

		expect( params ).toHaveProperty( 'comp' );
		expect( params ).toHaveProperty( 'compare_preset' );
	} );
} );

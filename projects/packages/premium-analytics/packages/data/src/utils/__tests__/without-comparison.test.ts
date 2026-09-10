/**
 * Internal dependencies
 */
import { hasComparisonEnabled } from '../search';
import { withoutComparison } from '../without-comparison';
import type { ReportParams } from '../search';

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

	/*
	 * The two halves of the same notion, and the reason the report pages can
	 * strip a comparison and trust it is gone. It holds only while the fields
	 * `hasComparisonEnabled` reads stay a subset of the ones removed here.
	 */
	it( 'leaves nothing `hasComparisonEnabled` still recognises', () => {
		expect( hasComparisonEnabled( COMPARING_PARAMS ) ).toBe( true );
		expect( hasComparisonEnabled( withoutComparison( COMPARING_PARAMS ) ) ).toBe( false );
	} );

	it( 'does not mutate the input', () => {
		const params = { ...COMPARING_PARAMS };

		withoutComparison( params );

		expect( params ).toHaveProperty( 'comp' );
		expect( params ).toHaveProperty( 'compare_preset' );
	} );
} );

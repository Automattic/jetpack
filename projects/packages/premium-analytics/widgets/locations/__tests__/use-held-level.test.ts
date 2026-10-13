/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useHeldLevel from '../use-held-level';

type Args = Parameters< typeof useHeldLevel< string > >[ 0 ];

const COUNTRIES = [ 'United States' ];
const REGIONS = [ 'Minnesota' ];
const CITIES = [ 'Minneapolis' ];

const SETTLED_COUNTRIES: Args = {
	data: COUNTRIES,
	hasComparison: true,
	isLoading: false,
	drillDepth: 0,
	reportParams: { preset: 'last-30-days' },
};

/** Render the hook on the settled country level. */
function renderSettled( initialProps = SETTLED_COUNTRIES ) {
	return renderHook( ( args: Args ) => useHeldLevel( args ), { initialProps } );
}

describe( 'useHeldLevel', () => {
	it( 'holds the settled level whole until the drilled level lands', () => {
		const { result, rerender } = renderSettled();

		// One query of a comparison has landed with the next level's rows.
		rerender( {
			...SETTLED_COUNTRIES,
			data: REGIONS,
			hasComparison: false,
			isLoading: true,
			drillDepth: 1,
		} );

		expect( result.current ).toEqual( { data: COUNTRIES, hasComparison: true, isHeld: true } );

		rerender( { ...SETTLED_COUNTRIES, data: REGIONS, hasComparison: false, drillDepth: 1 } );

		expect( result.current ).toEqual( { data: REGIONS, hasComparison: false, isHeld: false } );
	} );

	it( 'holds the rows a level refreshed to', () => {
		const refreshed = [ 'Canada' ];
		const { result, rerender } = renderSettled();
		rerender( { ...SETTLED_COUNTRIES, data: refreshed } );

		rerender( { ...SETTLED_COUNTRIES, data: refreshed, isLoading: true, drillDepth: 1 } );

		expect( result.current.data ).toBe( refreshed );
	} );

	it.each( [
		[ 'the same level reloads', SETTLED_COUNTRIES, { drillDepth: 0 } ],
		[
			'going back up to the regions',
			{ ...SETTLED_COUNTRIES, data: CITIES, drillDepth: 2 },
			{ drillDepth: 1 },
		],
		[ 'the date range changes', SETTLED_COUNTRIES, { reportParams: { preset: 'last-7-days' } } ],
		[ 'leaving an empty level', { ...SETTLED_COUNTRIES, data: [] }, {} ],
	] )( 'holds nothing when %s', ( _, settled, change ) => {
		const { result, rerender } = renderSettled( settled );

		rerender( { ...settled, isLoading: true, drillDepth: 1, ...change } );

		expect( result.current.isHeld ).toBe( false );
	} );
} );

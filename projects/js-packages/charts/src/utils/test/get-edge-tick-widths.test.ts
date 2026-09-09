import { getEdgeTickWidths } from '../get-edge-tick-widths';

const mockGetStringWidth = jest.fn();
jest.mock( '@visx/text', () => ( {
	...jest.requireActual( '@visx/text' ),
	getStringWidth: ( ...args: unknown[] ) => mockGetStringWidth( ...args ),
} ) );

describe( 'getEdgeTickWidths', () => {
	beforeEach( () => {
		mockGetStringWidth.mockReset();
		mockGetStringWidth.mockImplementation( ( label: string ) => label.length );
	} );

	it( 'measures the formatted first and last ticks', () => {
		const style = { fontSize: 11 };

		const widths = getEdgeTickWidths( [ 1, 2, 3 ], value => `tick-${ value }`, style );

		expect( widths ).toEqual( { first: 6, last: 6 } );
		expect( mockGetStringWidth ).toHaveBeenCalledWith( 'tick-1', style );
		expect( mockGetStringWidth ).toHaveBeenCalledWith( 'tick-3', style );
	} );

	it( 'passes each tick its own index', () => {
		getEdgeTickWidths( [ 'a', 'b', 'c' ], ( value, index ) => `${ index }:${ value }` );

		expect( mockGetStringWidth ).toHaveBeenCalledWith( '0:a', undefined );
		expect( mockGetStringWidth ).toHaveBeenCalledWith( '2:c', undefined );
	} );

	it( 'measures a single tick as both edges', () => {
		expect( getEdgeTickWidths( [ 42 ], value => `${ value }` ) ).toEqual( { first: 2, last: 2 } );
	} );

	it( 'measures the raw value when there is no formatter', () => {
		getEdgeTickWidths( [ 'abcd' ] );

		expect( mockGetStringWidth ).toHaveBeenCalledWith( 'abcd', undefined );
	} );

	it( 'returns nothing to reserve for an axis with no ticks', () => {
		expect( getEdgeTickWidths( [] ) ).toEqual( { first: null, last: null } );
		expect( mockGetStringWidth ).not.toHaveBeenCalled();
	} );
} );

/**
 * @jest-environment jsdom
 */
import { getStringWidth } from '@visx/text';
import { getLongestTickWidth } from '../utils';

jest.mock( '@visx/text', () => ( {
	getStringWidth: jest.fn(),
} ) );

describe( 'getLongestTickWidth', () => {
	beforeEach( () => {
		// Reset the mock before each test
		( getStringWidth as unknown as jest.Mock ).mockReset();
	} );

	it( 'returns the width of the longest formatted tick', () => {
		const ticks = [ 'a', 'bb', 'ccc' ];
		const formatTick = ( tick: string ) => tick;
		const labelStyle = { fontSize: 12 };
		// Mock getStringWidth to return the length of the string * 10
		( getStringWidth as unknown as jest.Mock ).mockImplementation(
			( str: string ) => str.length * 10
		);

		const result = getLongestTickWidth( ticks, formatTick, labelStyle );
		expect( result ).toBe( 30 ); // 'ccc' is the longest, 3*10 = 30
		// Ensure getStringWidth was called with 'ccc' and labelStyle
		expect( getStringWidth ).toHaveBeenCalledWith( 'ccc', labelStyle );
	} );

	it( 'uses the formatted tick values', () => {
		const ticks = [ 1, 22, 333 ];
		const formatTick = ( tick: number ) => `tick-${ tick }`;
		( getStringWidth as unknown as jest.Mock ).mockImplementation( ( str: string ) => str.length );

		const result = getLongestTickWidth( ticks, formatTick );
		// 'tick-333' is the longest (8 chars)
		expect( result ).toBe( 8 );
		// Ensure getStringWidth was called with 'tick-333'
		expect( getStringWidth ).toHaveBeenCalledWith( 'tick-333', undefined );
	} );
} );

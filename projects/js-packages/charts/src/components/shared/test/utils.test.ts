/**
 * @jest-environment jsdom
 */
import { getStringWidth } from '@visx/text';
import { formatYTick, getLongestLabelWidth } from '../utils';

jest.mock( '@visx/text', () => ( {
	getStringWidth: jest.fn(),
} ) );

describe( 'formatYTick', () => {
	describe( 'edge cases', () => {
		test( 'returns default format for empty array', () => {
			const formatter = formatYTick( [] );
			expect( formatter( 1234 ) ).toBe( '1,234' );
		} );

		test( 'returns default format for null/undefined', () => {
			const formatterNull = formatYTick( null );
			const formatterUndefined = formatYTick( undefined );
			expect( formatterNull( 1234 ) ).toBe( '1,234' );
			expect( formatterUndefined( 1234 ) ).toBe( '1,234' );
		} );

		test( 'returns default format for non-array input', () => {
			// @ts-expect-error Test for non-array input.
			const formatter = formatYTick( 'not an array' );
			expect( formatter( 1234 ) ).toBe( '1,234' );
		} );

		test( 'handles invalid values in data', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: NaN },
				{ date: new Date( '2024-01-02' ), value: null },
				{ date: new Date( '2024-01-03' ), value: undefined },
				{ date: new Date( '2024-01-04' ), value: 500 },
			];
			const formatter = formatYTick( data );
			expect( formatter( 1234 ) ).toBe( '1,234' ); // Should use default format for max value 500
		} );
	} );

	describe( 'format selection based on data range', () => {
		test( 'uses default format for values < 1000', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 100 },
				{ date: new Date( '2024-01-02' ), value: 500 },
				{ date: new Date( '2024-01-03' ), value: 999 },
			];
			const formatter = formatYTick( data );
			expect( formatter( 100 ) ).toBe( '100' );
			expect( formatter( 500 ) ).toBe( '500' );
			expect( formatter( 999 ) ).toBe( '999' );
		} );

		test( 'uses thousands format for values >= 1000 and < 1M', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 1000 },
				{ date: new Date( '2024-01-02' ), value: 50000 },
				{ date: new Date( '2024-01-03' ), value: 999999 },
			];
			const formatter = formatYTick( data );
			expect( formatter( 1000 ) ).toBe( '1k' );
			expect( formatter( 50000 ) ).toBe( '50k' );
			expect( formatter( 500000 ) ).toBe( '500k' );
		} );

		test( 'uses millions format for values >= 1M and < 1B', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 1000000 },
				{ date: new Date( '2024-01-02' ), value: 50000000 },
				{ date: new Date( '2024-01-03' ), value: 999999999 },
			];
			const formatter = formatYTick( data );
			expect( formatter( 1300000 ) ).toBe( '1.3M' );
			expect( formatter( 50000000 ) ).toBe( '50M' );
			expect( formatter( 500000000 ) ).toBe( '500M' );
		} );

		test( 'uses billions format for values >= 1B', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 1000000000 },
				{ date: new Date( '2024-01-02' ), value: 50000000000 },
				{ date: new Date( '2024-01-03' ), value: 1200000000000 },
			];
			const formatter = formatYTick( data );
			expect( formatter( 1000000000 ) ).toBe( '1.00G' );
			expect( formatter( 50000000000 ) ).toBe( '50.0G' );
			expect( formatter( 1200000000000 ) ).toBe( '1.20T' );
		} );
	} );

	describe( 'handles negative values', () => {
		test( 'uses absolute values for format selection', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: -1000000000 }, // -1B
			];
			const formatter = formatYTick( data );
			// Should use billions format because max absolute value is 1B
			expect( formatter( -1000000000 ) ).toBe( '−1.00G' );
		} );
	} );

	describe( 'boundary conditions', () => {
		test( 'handles exact boundary values', () => {
			// Test exact 1K boundary
			const dataK = [ { date: new Date( '2024-01-01' ), value: 1000 } ];
			const formatterK = formatYTick( dataK );
			expect( formatterK( 1000 ) ).toBe( '1k' );

			// Test exact 1M boundary
			const dataM = [ { date: new Date( '2024-01-01' ), value: 1000000 } ];
			const formatterM = formatYTick( dataM );
			expect( formatterM( 1000000 ) ).toBe( '1.0M' );

			// Test exact 1B boundary
			const dataB = [ { date: new Date( '2024-01-01' ), value: 1000000000 } ];
			const formatterB = formatYTick( dataB );
			expect( formatterB( 1000000000 ) ).toBe( '1.00G' );
		} );

		test( 'handles values just below boundaries', () => {
			// Test just below 1K
			const dataK = [ { date: new Date( '2024-01-01' ), value: 999 } ];
			const formatterK = formatYTick( dataK );
			expect( formatterK( 999 ) ).toBe( '999' );

			// Test just below 1M
			const dataM = [ { date: new Date( '2024-01-01' ), value: 999999 } ];
			const formatterM = formatYTick( dataM );
			expect( formatterM( 999999 ) ).toBe( '1M' );

			// Test just below 1B
			const dataB = [ { date: new Date( '2024-01-01' ), value: 999999999 } ];
			const formatterB = formatYTick( dataB );
			expect( formatterB( 999999999 ) ).toBe( '1.0G' );
		} );
	} );
} );

describe( 'getLongestLabelWidth', () => {
	beforeEach( () => {
		// Reset the mock before each test
		( getStringWidth as unknown as jest.Mock ).mockReset();
	} );

	describe( 'edge cases', () => {
		test( 'returns default width for empty array', () => {
			const simpleFormat = ( value: number ) => value.toString();
			const width = getLongestLabelWidth( [], simpleFormat );
			expect( width ).toBe( 40 ); // DEFAULT_LABEL_WIDTH
		} );

		test( 'returns default width for null/undefined data', () => {
			const simpleFormat = ( value: number ) => value.toString();
			const widthNull = getLongestLabelWidth( null, simpleFormat );
			const widthUndefined = getLongestLabelWidth( undefined, simpleFormat );
			expect( widthNull ).toBe( 40 );
			expect( widthUndefined ).toBe( 40 );
		} );
	} );

	describe( 'label width calculation', () => {
		test( 'calculates width for simple data', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 100 },
				{ date: new Date( '2024-01-02' ), value: 50000 },
				{ date: new Date( '2024-01-03' ), value: 999 },
			];
			const tickFormat = ( value: number ) => value.toString();

			// Mock getStringWidth to return a specific width
			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 80 );

			const width = getLongestLabelWidth( data, tickFormat );

			expect( getStringWidth ).toHaveBeenCalledWith( '50000', undefined );
			expect( width ).toBe( 80 );
		} );

		test( 'chooses longest label between max and min values', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 9 }, // Shorter when formatted
				{ date: new Date( '2024-01-02' ), value: 1000000 }, // Longer when formatted
			];
			const tickFormat = ( value: number ) =>
				value >= 1000000 ? `${ value / 1000000 }M` : value.toString();

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 60 );

			const width = getLongestLabelWidth( data, tickFormat );

			// Should call with "1M" (formatted max value) since it's longer than "9"
			expect( getStringWidth ).toHaveBeenCalledWith( '1M', undefined );
			expect( width ).toBe( 60 );
		} );

		test( 'chooses min value label if it is longer', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: -100000000 }, // Longer when formatted (negative)
				{ date: new Date( '2024-01-02' ), value: 50 }, // Shorter when formatted
			];
			const tickFormat = ( value: number ) => value.toString();

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 120 );

			const width = getLongestLabelWidth( data, tickFormat );

			// Should call with "-100000000" since it's longer than "50"
			expect( getStringWidth ).toHaveBeenCalledWith( '-100000000', undefined );
			expect( width ).toBe( 120 );
		} );

		test( 'passes labelStyle to getStringWidth', () => {
			const data = [ { date: new Date( '2024-01-01' ), value: 100 } ];
			const tickFormat = ( value: number ) => value.toString();
			const labelStyle = { fontSize: 12, fontFamily: 'Arial' };

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 50 );

			const width = getLongestLabelWidth( data, tickFormat, labelStyle );

			expect( getStringWidth ).toHaveBeenCalledWith( '100', labelStyle );
			expect( width ).toBe( 50 );
		} );

		test( 'returns default width when getStringWidth returns falsy value', () => {
			const data = [ { date: new Date( '2024-01-01' ), value: 100 } ];
			const tickFormat = ( value: number ) => value.toString();

			// Mock getStringWidth to return 0, null, or undefined
			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 0 );
			expect( getLongestLabelWidth( data, tickFormat ) ).toBe( 40 );

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( null );
			expect( getLongestLabelWidth( data, tickFormat ) ).toBe( 40 );

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( undefined );
			expect( getLongestLabelWidth( data, tickFormat ) ).toBe( 40 );
		} );
	} );

	describe( 'integration with formatYTick', () => {
		test( 'works correctly with formatYTick output', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 1200000000 }, // 1.2G
				{ date: new Date( '2024-01-02' ), value: 45000000 }, // 45M
			];
			const formatter = formatYTick( data );

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 75 );

			const width = getLongestLabelWidth( data, formatter );

			// getLongestLabelWidth compares max vs min formatted values
			// Max: 1200000000 -> "1.20G" (5 chars)
			// Min: 45000000 -> "45M" (3 chars) - formatted as string since it's below 1B threshold in the mock
			// So it should call with the longer one
			expect( getStringWidth ).toHaveBeenCalledWith( '1.20G', undefined );
			expect( width ).toBe( 75 );
		} );
	} );

	describe( 'handles equal length labels', () => {
		test( 'chooses max value when labels have equal length', () => {
			const data = [
				{ date: new Date( '2024-01-01' ), value: 1000 }, // "1000" - 4 chars
				{ date: new Date( '2024-01-02' ), value: -999 }, // "-999" - 4 chars
			];
			const tickFormat = ( value: number ) => value.toString();

			( getStringWidth as unknown as jest.Mock ).mockReturnValue( 45 );

			const width = getLongestLabelWidth( data, tickFormat );

			// Should choose max value (1000) when lengths are equal
			expect( getStringWidth ).toHaveBeenCalledWith( '1000', undefined );
			expect( width ).toBe( 45 );
		} );
	} );
} );

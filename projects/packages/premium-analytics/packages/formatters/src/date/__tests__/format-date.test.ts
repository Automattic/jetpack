/**
 * External dependencies
 */
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { formatDate, DATE_FORMATS as FORMATS } from '../format-date';

jest.mock( 'date-fns', () => ( {
	format: jest.fn(),
} ) );

describe( 'formatDate', () => {
	/**
	 * Setup the date-fns format mock that simulates the library.
	 */
	const setupDateFormat = () => {
		( format as jest.Mock ).mockImplementation(
			( _date: Date | number | string, formatString: string ) => {
				const formatMap: Record< string, string > = {
					[ FORMATS.short ]: 'Jun 21',
					[ FORMATS.medium ]: 'Jun 21, 2025',
					[ FORMATS.long ]: 'June 21, 2025',
					[ FORMATS.full ]: 'Wednesday, June 21, 2025',
					[ FORMATS.day ]: '21',
					[ FORMATS.month ]: 'Jun',
					[ FORMATS.year ]: '2025',
					[ FORMATS.monthYear ]: 'Jun 2025',
					[ FORMATS.numeric ]: '06/21/2025',
					[ FORMATS.iso ]: '2025-06-21',
					[ FORMATS.dateTime ]: 'Jun 21, 2025 2:30 PM',
					'dd/MM/yyyy': '21/06/2025',
				};

				return formatMap[ formatString ] || formatString;
			}
		);
	};

	beforeEach( () => {
		jest.clearAllMocks();
		setupDateFormat();
	} );

	describe( 'named formats', () => {
		const testDate = new Date( '2025-06-21T14:30:00' );

		it( 'formats date with "short" preset', () => {
			const result = formatDate( testDate, 'short' );
			expect( result ).toBe( 'Jun 21' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.short );
		} );

		it( 'formats date with "medium" preset (default)', () => {
			const result = formatDate( testDate, 'medium' );
			expect( result ).toBe( 'Jun 21, 2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.medium );
		} );

		it( 'uses "medium" as default when no format specified', () => {
			const result = formatDate( testDate );
			expect( result ).toBe( 'Jun 21, 2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.medium );
		} );

		it( 'formats date with "long" preset', () => {
			const result = formatDate( testDate, 'long' );
			expect( result ).toBe( 'June 21, 2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.long );
		} );

		it( 'formats date with "full" preset', () => {
			const result = formatDate( testDate, 'full' );
			expect( result ).toBe( 'Wednesday, June 21, 2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.full );
		} );

		it( 'formats date with "day" preset', () => {
			const result = formatDate( testDate, 'day' );
			expect( result ).toBe( '21' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.day );
		} );

		it( 'formats date with "month" preset', () => {
			const result = formatDate( testDate, 'month' );
			expect( result ).toBe( 'Jun' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.month );
		} );

		it( 'formats date with "year" preset', () => {
			const result = formatDate( testDate, 'year' );
			expect( result ).toBe( '2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.year );
		} );

		it( 'formats date with "monthYear" preset', () => {
			const result = formatDate( testDate, 'monthYear' );
			expect( result ).toBe( 'Jun 2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.monthYear );
		} );

		it( 'formats date with "numeric" preset', () => {
			const result = formatDate( testDate, 'numeric' );
			expect( result ).toBe( '06/21/2025' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.numeric );
		} );

		it( 'formats date with "iso" preset', () => {
			const result = formatDate( testDate, 'iso' );
			expect( result ).toBe( '2025-06-21' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.iso );
		} );

		it( 'formats date with "dateTime" preset', () => {
			const result = formatDate( testDate, 'dateTime' );
			expect( result ).toBe( 'Jun 21, 2025 2:30 PM' );
			expect( format ).toHaveBeenCalledWith( testDate, FORMATS.dateTime );
		} );
	} );

	describe( 'custom format strings', () => {
		const testDate = new Date( '2025-06-21T14:30:00' );

		it( 'accepts custom format string', () => {
			const customFormat = 'dd/MM/yyyy';
			const result = formatDate( testDate, customFormat );
			expect( result ).toBe( '21/06/2025' );
			expect( format ).toHaveBeenCalledWith( testDate, customFormat );
		} );
	} );

	describe( 'date input types', () => {
		it( 'accepts Date object', () => {
			const dateObj = new Date( '2025-06-21' );
			formatDate( dateObj, 'short' );
			expect( format ).toHaveBeenCalledWith( dateObj, FORMATS.short );
		} );

		it( 'accepts timestamp number', () => {
			const timestamp = 1718985000000;
			formatDate( timestamp, 'short' );
			expect( format ).toHaveBeenCalledWith( timestamp, FORMATS.short );
		} );

		it( 'accepts date string', () => {
			const dateString = '2025-06-21';
			formatDate( dateString, 'short' );
			expect( format ).toHaveBeenCalledWith( dateString, FORMATS.short );
		} );
	} );
} );

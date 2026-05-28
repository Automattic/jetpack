/**
 * Internal dependencies
 */
import { formatDate } from '../format-date';
import { formatDateRange } from '../format-date-range';

jest.mock( '../format-date' );

describe( 'formatDateRange', () => {
	/**
	 * Setup mock for formatDate function.
	 */
	const setupMocks = () => {
		( formatDate as jest.Mock ).mockImplementation( ( date: Date, formatString?: string ) => {
			const monthNames = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
			];

			const dateStr = date.toISOString().split( 'T' )[ 0 ];

			if ( formatString === 'iso' ) {
				return dateStr;
			}

			// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- allow unused vars before return for test mock
			const [ year, month, day ] = dateStr.split( '-' );
			const monthName = monthNames[ parseInt( month, 10 ) - 1 ];

			if ( formatString === 'year' ) {
				return year;
			}

			if ( formatString === 'monthYear' ) {
				return `${ monthName } ${ year }`;
			}

			const dayNum = parseInt( day, 10 );
			if ( formatString === 'short' ) {
				return `${ monthName } ${ dayNum }`;
			}

			if ( formatString === 'd, yyyy' ) {
				return `${ dayNum }, ${ year }`;
			}

			// Default: medium format
			return `${ monthName } ${ dayNum }, ${ year }`;
		} );
	};

	beforeEach( () => {
		jest.clearAllMocks();
		setupMocks();
	} );

	describe( 'edge cases', () => {
		it( 'returns empty string when "from" is missing', () => {
			const result = formatDateRange( {
				from: undefined,
				to: new Date( '2025-06-21' ),
			} );
			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when "to" is missing', () => {
			const result = formatDateRange( {
				from: new Date( '2025-06-21' ),
				to: undefined,
			} );
			expect( result ).toBe( '' );
		} );

		it( 'returns empty string when both dates are missing', () => {
			const result = formatDateRange( {
				from: undefined,
				to: undefined,
			} );
			expect( result ).toBe( '' );
		} );
	} );

	describe( 'same date', () => {
		it( 'formats same date as single date', () => {
			const date = new Date( '2025-06-21' );
			const result = formatDateRange( { from: date, to: date } );
			expect( result ).toBe( 'Jun 21, 2025' );
		} );
	} );

	describe( 'same month and year', () => {
		it( 'formats date range within same month', () => {
			const from = new Date( '2025-06-21' );
			const to = new Date( '2025-06-25' );
			const result = formatDateRange( { from, to } );
			expect( result ).toBe( 'Jun 21-25, 2025' );
		} );
	} );

	describe( 'same year, different months', () => {
		it( 'formats date range across months in same year', () => {
			const from = new Date( '2025-06-21' );
			const to = new Date( '2025-07-25' );
			const result = formatDateRange( { from, to } );
			expect( result ).toBe( 'Jun 21-Jul 25, 2025' );
		} );
	} );

	describe( 'different years', () => {
		it( 'formats date range across different years', () => {
			const from = new Date( '2024-06-21' );
			const to = new Date( '2025-07-25' );
			const result = formatDateRange( { from, to } );
			expect( result ).toBe( 'Jun 21, 2024-Jul 25, 2025' );
		} );
	} );
} );

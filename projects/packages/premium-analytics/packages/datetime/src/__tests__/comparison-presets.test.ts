/**
 * Internal dependencies
 */
import { COMPARISON_PRESETS, isComparisonPresetId } from '../get-comparison-range';
import { getComparisonOptions } from '../presets';

/**
 * A day-aligned range, inclusive on both ends. Months are 0-based.
 * @param from
 * @param to
 */
const daysRange = ( from: [ number, number, number ], to: [ number, number, number ] ) => ( {
	from: new Date( from[ 0 ], from[ 1 ], from[ 2 ], 0, 0, 0, 0 ),
	to: new Date( to[ 0 ], to[ 1 ], to[ 2 ], 23, 59, 59, 999 ),
} );

const ids = ( range: Parameters< typeof getComparisonOptions >[ 0 ] ) =>
	getComparisonOptions( range ).map( option => option.id );

const labels = ( range: Parameters< typeof getComparisonOptions >[ 0 ] ) =>
	getComparisonOptions( range ).map( option => option.label );

describe( 'comparison options', () => {
	/*
	 * The candidate set and its order are a design decision (WOOA7S-2028), not
	 * an accident of what the range math supports: the menu offers these four
	 * plus "No comparison". Changing it should be a deliberate edit here.
	 */
	it( 'offers the period, week, month and year presets, in that order', () => {
		expect( COMPARISON_PRESETS ).toEqual( [
			'previous-period',
			'previous-week',
			'previous-month',
			'previous-year',
		] );
	} );

	it( 'rejects an identifier outside the set', () => {
		expect( isComparisonPresetId( 'previous-week' ) ).toBe( true );
		expect( isComparisonPresetId( 'previous-quarter' ) ).toBe( false );
	} );

	it( 'returns nothing for an incomplete or inverted range', () => {
		expect( getComparisonOptions( {} ) ).toEqual( [] );
		expect( getComparisonOptions( { from: new Date( 2026, 7, 30 ) } ) ).toEqual( [] );
		expect( getComparisonOptions( daysRange( [ 2026, 7, 30 ], [ 2026, 7, 29 ] ) ) ).toEqual( [] );
	} );

	it( 'offers every shift for a single day, naming each target', () => {
		const yesterday = daysRange( [ 2026, 7, 30 ], [ 2026, 7, 30 ] );

		expect( labels( yesterday ) ).toEqual( [
			'Previous day',
			'Same period from last week',
			'Same period in July',
			'Same period in 2025',
		] );

		const [ period, week, month, year ] = getComparisonOptions( yesterday );
		expect( period.range ).toEqual( daysRange( [ 2026, 7, 29 ], [ 2026, 7, 29 ] ) );
		expect( week.range ).toEqual( daysRange( [ 2026, 7, 23 ], [ 2026, 7, 23 ] ) );
		expect( month.range ).toEqual( daysRange( [ 2026, 6, 30 ], [ 2026, 6, 30 ] ) );
		expect( year.range ).toEqual( daysRange( [ 2025, 7, 30 ], [ 2025, 7, 30 ] ) );
	} );

	it( 'reads a rolling 24-hour window in hours', () => {
		const last24Hours = {
			from: new Date( 2026, 7, 30, 15, 0, 0, 0 ),
			to: new Date( 2026, 7, 31, 14, 59, 59, 999 ),
		};

		const options = getComparisonOptions( last24Hours );

		expect( options.map( o => o.id ) ).toEqual( [
			'previous-period',
			'previous-week',
			'previous-month',
			'previous-year',
		] );
		expect( options[ 0 ].label ).toBe( 'Previous 24 hours' );
		expect( options[ 1 ].range ).toEqual( {
			from: new Date( 2026, 7, 23, 15, 0, 0, 0 ),
			to: new Date( 2026, 7, 24, 14, 59, 59, 999 ),
		} );
	} );

	/*
	 * For a 7-day range the week shift and the previous period resolve to the
	 * same window, so the week entry is dropped rather than listed twice.
	 */
	it( 'dedupes the week shift out of a 7-day range', () => {
		const week = daysRange( [ 2026, 7, 24 ], [ 2026, 7, 30 ] );

		expect( labels( week ) ).toEqual( [
			'Previous 7 days',
			'Same period in July',
			'Same period in 2025',
		] );
		expect( getComparisonOptions( week )[ 0 ].range ).toEqual(
			daysRange( [ 2026, 7, 17 ], [ 2026, 7, 23 ] )
		);
	} );

	it( 'drops the month shift past 28 days, keeping the year', () => {
		const thirtyDays = daysRange( [ 2026, 7, 1 ], [ 2026, 7, 30 ] );

		expect( labels( thirtyDays ) ).toEqual( [ 'Previous 30 days', 'Same period in 2025' ] );
	} );

	it( 'offers the month shift at exactly 28 days', () => {
		const twentyEightDays = daysRange( [ 2026, 7, 3 ], [ 2026, 7, 30 ] );

		expect( ids( twentyEightDays ) ).toEqual( [
			'previous-period',
			'previous-month',
			'previous-year',
		] );
		expect( labels( twentyEightDays )[ 1 ] ).toBe( 'Same period in July' );
	} );

	/*
	 * A whole calendar month steps back to the previous calendar month, and the
	 * label says so instead of pretending a 31-day shift.
	 */
	it( 'sets a whole month against the previous calendar month', () => {
		const july = daysRange( [ 2026, 6, 1 ], [ 2026, 6, 31 ] );

		expect( labels( july ) ).toEqual( [ 'Previous month', 'Same period in 2025' ] );
		expect( getComparisonOptions( july )[ 0 ].range ).toEqual(
			daysRange( [ 2026, 5, 1 ], [ 2026, 5, 30 ] )
		);
	} );

	/*
	 * Whole February passes the 28-day month gate, but its month shift equals
	 * the previous period, so dedupe leaves a single January entry.
	 */
	it( 'dedupes the month shift out of a whole February', () => {
		const february = daysRange( [ 2026, 1, 1 ], [ 2026, 1, 28 ] );

		expect( labels( february ) ).toEqual( [ 'Previous month', 'Same period in 2025' ] );
		expect( getComparisonOptions( february )[ 0 ].range ).toEqual(
			daysRange( [ 2026, 0, 1 ], [ 2026, 0, 31 ] )
		);
	} );

	/*
	 * A calendar year steps back to the previous calendar year even across a
	 * leap year — a 365-day shift would land on Jan 2 — and the converging
	 * year option is gated out, leaving a single entry.
	 */
	it( 'sets a calendar year against the previous calendar year', () => {
		const year2025 = daysRange( [ 2025, 0, 1 ], [ 2025, 11, 31 ] );

		expect( labels( year2025 ) ).toEqual( [ 'Previous 12 months' ] );
		expect( getComparisonOptions( year2025 )[ 0 ].range ).toEqual(
			daysRange( [ 2024, 0, 1 ], [ 2024, 11, 31 ] )
		);
	} );

	it( 'steps a rolling 12-month window back by its month count', () => {
		const last12Months = daysRange( [ 2025, 7, 31 ], [ 2026, 7, 30 ] );

		expect( labels( last12Months ) ).toEqual( [ 'Previous 12 months' ] );
		expect( getComparisonOptions( last12Months )[ 0 ].range ).toEqual(
			daysRange( [ 2024, 7, 31 ], [ 2025, 7, 30 ] )
		);
	} );

	/*
	 * Labels name the comparison target, not today: a range set in 2025 offers
	 * the same period in 2024.
	 */
	it( 'names the year of the comparison for a past custom range', () => {
		const pastRange = daysRange( [ 2025, 7, 4 ], [ 2025, 8, 29 ] );

		expect( labels( pastRange ) ).toEqual( [ 'Previous 57 days', 'Same period in 2024' ] );
	} );

	it( 'names the month the comparison starts in across a year boundary', () => {
		const january5 = daysRange( [ 2027, 0, 5 ], [ 2027, 0, 5 ] );

		expect( labels( january5 ) ).toEqual( [
			'Previous day',
			'Same period from last week',
			'Same period in December',
			'Same period in 2026',
		] );
	} );

	it( 'labels every option and gives each a trigger abbreviation', () => {
		for ( const option of getComparisonOptions( daysRange( [ 2026, 7, 30 ], [ 2026, 7, 30 ] ) ) ) {
			expect( option.label ).toBeTruthy();
			expect( option.shortLabel ).toBeTruthy();
		}
	} );
} );

/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { EN_US_SETTINGS, ES_ES_SETTINGS, utcDate } from '../__fixtures__/wp-date-settings';
import { formatDateRange } from '../format-date-range';

describe( 'formatDateRange', () => {
	describe( 'edge cases', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'returns an empty string when "from" is missing', () => {
			expect( formatDateRange( { from: undefined, to: utcDate( 2025, 6, 21 ) } ) ).toBe( '' );
		} );

		it( 'returns an empty string when "to" is missing', () => {
			expect( formatDateRange( { from: utcDate( 2025, 6, 21 ), to: undefined } ) ).toBe( '' );
		} );

		it( 'returns an empty string when the range itself is missing', () => {
			expect( formatDateRange() ).toBe( '' );
		} );
	} );

	describe( 'en_US site', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'collapses a single-day range to one date', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRange( { from: date, to: date } ) ).toBe( 'June 21, 2025' );
		} );

		it( 'spells out both ends of a range within one month', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( 'June 21, 2025 – June 25, 2025' );
		} );

		it( 'spells out both ends of a range spanning years', () => {
			expect(
				formatDateRange( { from: utcDate( 2024, 6, 21 ), to: utcDate( 2025, 7, 25 ) } )
			).toBe( 'June 21, 2024 – July 25, 2025' );
		} );
	} );

	describe( 'es_ES site', () => {
		beforeEach( () => setSettings( ES_ES_SETTINGS ) );

		it( 'follows the site date format on both ends', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( '21 de junio de 2025 – 25 de junio de 2025' );
		} );

		it( 'collapses a single-day range to one date', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRange( { from: date, to: date } ) ).toBe( '21 de junio de 2025' );
		} );
	} );
} );

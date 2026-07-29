/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { EN_US_SETTINGS, ES_ES_SETTINGS } from '../__fixtures__/wp-date-settings';
import { formatDate } from '../format-date';

// Midnight UTC, matching the fixtures' timezone, so no day shift is in play.
const JUNE_21 = '2025-06-21T00:00:00+00:00';

describe( 'formatDate', () => {
	describe( 'en_US site', () => {
		beforeEach( () => {
			setSettings( EN_US_SETTINGS );
		} );

		it( 'formats "medium" with the site date format', () => {
			expect( formatDate( JUNE_21, 'medium' ) ).toBe( 'June 21, 2025' );
		} );

		it( 'defaults to "medium"', () => {
			expect( formatDate( JUNE_21 ) ).toBe( 'June 21, 2025' );
		} );

		it( 'formats "short" as the site format without its year', () => {
			expect( formatDate( JUNE_21, 'short' ) ).toBe( 'June 21' );
		} );

		it( 'formats "year"', () => {
			expect( formatDate( JUNE_21, 'year' ) ).toBe( '2025' );
		} );

		it( 'formats "iso" as a machine-readable date', () => {
			expect( formatDate( JUNE_21, 'iso' ) ).toBe( '2025-06-21' );
		} );
	} );

	describe( 'es_ES site', () => {
		beforeEach( () => {
			setSettings( ES_ES_SETTINGS );
		} );

		it( 'orders "medium" the way the site format does', () => {
			expect( formatDate( JUNE_21, 'medium' ) ).toBe( '21 de junio de 2025' );
		} );

		it( 'drops the trailing " de <year>" for "short"', () => {
			expect( formatDate( JUNE_21, 'short' ) ).toBe( '21 de junio' );
		} );

		it( 'keeps "iso" untranslated so it stays machine-readable', () => {
			expect( formatDate( JUNE_21, 'iso' ) ).toBe( '2025-06-21' );
		} );
	} );
} );

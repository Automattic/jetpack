/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { EN_US_SETTINGS, ES_ES_SETTINGS, settingsFor } from '../__fixtures__/wp-date-settings';
import { formatDate, formatMondayFirstWeekday, formatWeekday } from '../format-date';

// Midnight UTC, matching the fixtures' timezone, so no day shift is in play.
const JUNE_21 = new Date( '2025-06-21T00:00:00+00:00' );

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

		it( 'leads "full" with the weekday', () => {
			expect( formatDate( JUNE_21, 'full' ) ).toBe( 'Saturday, June 21, 2025' );
		} );

		it( 'leads "fullNoYear" with the weekday and drops the year', () => {
			expect( formatDate( JUNE_21, 'fullNoYear' ) ).toBe( 'Saturday, June 21' );
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

		it( 'formats a weekday in the site locale', () => {
			expect( formatWeekday( 6 ) ).toBe( 'sábado' );
		} );
	} );

	it( 'falls back to the site format when removing the year leaves nothing', () => {
		setSettings( settingsFor( 'year-only-test', 'Y' ) );

		expect( formatDate( JUNE_21, 'short' ) ).toBe( '2025' );
	} );

	it( 'does not add a second weekday when the site format already names one', () => {
		setSettings( settingsFor( 'weekday-format-test', 'l, F j, Y' ) );

		expect( formatDate( JUNE_21, 'full' ) ).toBe( 'Saturday, June 21, 2025' );
	} );

	it( 'appends the site time format for "dateTime"', () => {
		setSettings( EN_US_SETTINGS );

		expect( formatDate( JUNE_21, 'dateTime' ) ).toBe( 'June 21, 2025 12:00 am' );
	} );
} );

describe( 'formatMondayFirstWeekday', () => {
	it( 'reads index 0 as Monday and 6 as Sunday', () => {
		// The offset is the whole point of the helper: a missing or reversed one
		// still yields a real weekday name, so both ends are pinned.
		expect( formatMondayFirstWeekday( 0 ) ).toBe( 'Monday' );
		expect( formatMondayFirstWeekday( 6 ) ).toBe( 'Sunday' );
	} );
} );

/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatDate } from '../format-date';

/**
 * Build a `@wordpress/date` settings object for a locale.
 *
 * Only the fields the formatter reads are varied; the rest mirror what
 * WordPress core sends to the page.
 *
 * @param locale     - Moment locale name.
 * @param dateFormat - The site's `date_format` option, PHP tokens.
 * @param months     - Translated full month names, January first.
 * @return Settings ready for `setSettings`.
 */
const settingsFor = ( locale: string, dateFormat: string, months: string[] ) => ( {
	l10n: {
		locale,
		months,
		monthsShort: months.map( m => m.slice( 0, 3 ) ),
		weekdays: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
		weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		meridiem: { am: 'am', AM: 'AM', pm: 'pm', PM: 'PM' },
		relative: { future: 'in %s', past: '%s ago' },
		startOfWeek: 0 as const,
	},
	formats: {
		time: 'g:i a',
		date: dateFormat,
		datetime: `${ dateFormat } g:i a`,
		datetimeAbbreviated: `${ dateFormat } g:i a`,
	},
	// Fixed offset so the assertions do not depend on the machine's timezone.
	timezone: { offset: 0, offsetFormatted: '0', string: 'UTC', abbr: 'UTC' },
} );

const EN_MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const ES_MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

// Midnight UTC, matching the fixture timezone, so no day shift is in play.
const JUNE_21 = '2025-06-21T00:00:00+00:00';

describe( 'formatDate', () => {
	describe( 'en_US site', () => {
		beforeEach( () => {
			setSettings( settingsFor( 'en-us-test', 'F j, Y', EN_MONTHS ) );
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
			setSettings( settingsFor( 'es-es-test', 'j \\d\\e F \\d\\e Y', ES_MONTHS ) );
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

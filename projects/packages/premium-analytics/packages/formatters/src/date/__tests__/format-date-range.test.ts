/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	EN_US_SETTINGS,
	ES_ES_SETTINGS,
	settingsFor,
	utcDate,
} from '../__fixtures__/wp-date-settings';
import { formatDateRange } from '../format-date-range';

// The en dash between thin spaces that CLDR puts between the ends of a range.
const SEP = '\u2009\u2013\u2009';

// The package's translatable spelled-out range pattern.
const FALLBACK_SEP = ' \u2013 ';

const JA_MONTHS = [
	'1\u6708',
	'2\u6708',
	'3\u6708',
	'4\u6708',
	'5\u6708',
	'6\u6708',
	'7\u6708',
	'8\u6708',
	'9\u6708',
	'10\u6708',
	'11\u6708',
	'12\u6708',
];

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

		it( 'falls back instead of throwing when one date is invalid', () => {
			expect(
				formatDateRange( { from: new Date( Number.NaN ), to: utcDate( 2025, 6, 21 ) } )
			).toBe( `Invalid date${ FALLBACK_SEP }June 21, 2025` );
		} );
	} );

	describe( 'en_US site', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'collapses a single-day range to one date', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRange( { from: date, to: date } ) ).toBe( 'June 21, 2025' );
		} );

		it( 'elides the month and year shared within one month', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `June 21${ SEP }25, 2025` );
		} );

		it( 'elides only the year across months of the same year', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 7, 25 ) } )
			).toBe( `June 21${ SEP }July 25, 2025` );
		} );

		it( 'elides nothing across years', () => {
			expect(
				formatDateRange( { from: utcDate( 2024, 6, 21 ), to: utcDate( 2025, 7, 25 ) } )
			).toBe( `June 21, 2024${ SEP }July 25, 2025` );
		} );
	} );

	describe( 'es_ES site', () => {
		beforeEach( () => setSettings( ES_ES_SETTINGS ) );

		// The elision rule is Spanish, not a translated English one: the day
		// range leads and the shared "de junio de 2025" trails it once.
		it( 'elides the way Spanish does, not the way English does', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( '21–25 de junio de 2025' );
		} );

		it( 'elides nothing across years', () => {
			expect(
				formatDateRange( { from: utcDate( 2024, 6, 21 ), to: utcDate( 2025, 7, 25 ) } )
			).toBe( `21 de junio de 2024${ SEP }25 de julio de 2025` );
		} );

		it( 'collapses a single-day range to one date', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRange( { from: date, to: date } ) ).toBe( '21 de junio de 2025' );
		} );
	} );

	describe( 'site whose date format carries no year', () => {
		// `date_format` is a free-text field, so a format without a year is
		// reachable. Collapsing on the rendered strings would fold a whole year
		// apart into a single date.
		beforeEach( () => setSettings( settingsFor( 'en-no-year-test', 'F j' ) ) );

		it( 'still spells out both ends of a range spanning years', () => {
			expect(
				formatDateRange( { from: utcDate( 2024, 6, 21 ), to: utcDate( 2025, 6, 21 ) } )
			).toBe( `June 21${ FALLBACK_SEP }June 21` );
		} );

		it( 'collapses a genuine single-day range', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRange( { from: date, to: date } ) ).toBe( 'June 21' );
		} );
	} );

	describe( 'falling back where no elision rule can be trusted', () => {
		afterEach( () => {
			resetLocaleData( {}, 'jetpack-premium-analytics-pkg' );
		} );

		// A custom `date_format` is the site telling us how it wants dates
		// written. CLDR's rules describe a different format, so borrowing its
		// elision would quietly overrule the setting.
		it( 'keeps a custom date format and spells both ends out', () => {
			setSettings( settingsFor( 'en-custom-test', 'd/m/Y' ) );

			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `21/06/2025${ FALLBACK_SEP }25/06/2025` );
		} );

		it( 'rejects a custom format that only matches the first probe date', () => {
			setSettings( settingsFor( 'en_literal_probe', '\\J\\a\\n\\u\\a\\r\\y j, Y' ) );

			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `January 21, 2025${ FALLBACK_SEP }January 25, 2025` );
		} );

		it( 'uses the translated range pattern when spelling both ends out', () => {
			setSettings( settingsFor( 'en_translated_fallback', 'd/m/Y' ) );
			setLocaleData( { '%1$s – %2$s': [ '%1$s - %2$s' ] }, 'jetpack-premium-analytics-pkg' );

			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( '21/06/2025 - 25/06/2025' );
		} );

		// `ja` renders a single date as 2025年6月21日 but switches its ranges to
		// 2025/06/21～2025/06/25, so its elision cannot be mixed with the rest
		// of the dashboard's dates.
		it( 'spells both ends out where the locale restyles its ranges', () => {
			setSettings( settingsFor( 'ja-JP', 'Y年n月j日', JA_MONTHS ) );

			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `2025年6月21日${ FALLBACK_SEP }2025年6月25日` );
		} );
	} );
} );

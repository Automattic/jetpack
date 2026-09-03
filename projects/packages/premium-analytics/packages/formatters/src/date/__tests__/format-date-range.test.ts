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
import {
	formatDateRange,
	formatDateRangeCompact,
	formatDateRangeMinimal,
	formatDateRangeNatural,
} from '../format-date-range';

// The en dash between thin spaces that CLDR puts between the ends of a range.
const SEP = '\u2009\u2013\u2009';

// The package's translatable spelled-out range pattern.
const FALLBACK_SEP = ' \u2013 ';

const HU_MONTHS = [
	'január',
	'február',
	'március',
	'április',
	'május',
	'június',
	'július',
	'augusztus',
	'szeptember',
	'október',
	'november',
	'december',
];

// Punctuated, so they cannot be sliced out of the full names.
const HU_MONTHS_SHORT = [
	'jan.',
	'febr.',
	'márc.',
	'ápr.',
	'máj.',
	'jún.',
	'júl.',
	'aug.',
	'szept.',
	'okt.',
	'nov.',
	'dec.',
];

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

	describe( 'collapseSingleDay', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		// A rolling window sits on no day boundary, so nothing but the option
		// collapses it — the day-aligned case above collapses on its own.
		it( 'names a rolling 24-hour window by the day it ends on', () => {
			expect(
				formatDateRange(
					{ from: utcDate( 2025, 6, 20, 15 ), to: utcDate( 2025, 6, 21, 15 ) },
					{ collapseSingleDay: true }
				)
			).toBe( 'June 21, 2025' );
		} );

		it( 'leaves the same window as a range without the option', () => {
			expect(
				formatDateRange( { from: utcDate( 2025, 6, 20, 15 ), to: utcDate( 2025, 6, 21, 15 ) } )
			).toBe( `June 20${ SEP }21, 2025` );
		} );

		// An hour longer, and the window covers two days rather than one.
		it( 'keeps both ends of a 25-hour window', () => {
			expect(
				formatDateRange(
					{ from: utcDate( 2025, 6, 20, 14 ), to: utcDate( 2025, 6, 21, 15 ) },
					{ collapseSingleDay: true }
				)
			).toBe( `June 20${ SEP }21, 2025` );
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
		// reachable; collapsing on rendered strings would fold a year into a day.
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

		// A custom `date_format` is the site telling us how it wants dates written,
		// so borrowing CLDR's elision would quietly overrule the setting.
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
		// 2025/06/21～2025/06/25, so its elision cannot be mixed in.
		it( 'spells both ends out where the locale restyles its ranges', () => {
			setSettings( settingsFor( 'ja-JP', 'Y年n月j日', JA_MONTHS ) );

			expect(
				formatDateRange( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `2025年6月21日${ FALLBACK_SEP }2025年6月25日` );
		} );
	} );
} );

describe( 'formatDateRangeCompact', () => {
	describe( 'en_US site', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'abbreviates the month of a single date', () => {
			const date = utcDate( 2025, 6, 21 );
			expect( formatDateRangeCompact( { from: date, to: date } ) ).toBe( 'Jun 21, 2025' );
		} );

		// The elision has to survive the shorter month, or the compact form would
		// spell out more than the form it is meant to be shorter than.
		it( 'elides the way the spelled-out form does', () => {
			expect(
				formatDateRangeCompact( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) } )
			).toBe( `Jun 21${ SEP }25, 2025` );
		} );

		it( 'abbreviates both ends across months', () => {
			expect(
				formatDateRangeCompact( { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 7, 25 ) } )
			).toBe( `Jun 21${ SEP }Jul 25, 2025` );
		} );
	} );

	// Nothing to shorten, so the two forms agree rather than one of them
	// inventing an abbreviation.
	it( 'leaves a format that numbers its month alone', () => {
		setSettings( settingsFor( 'en-numeric-test', 'd/m/Y' ) );

		const range = { from: utcDate( 2025, 6, 21 ), to: utcDate( 2025, 6, 25 ) };

		expect( formatDateRangeCompact( range ) ).toBe( formatDateRange( range ) );
	} );
} );

describe( 'formatDateRangeMinimal', () => {
	// The fixtures put the site in UTC, so the site's year is this instant's.
	beforeAll( () => jest.useFakeTimers().setSystemTime( utcDate( 2026, 8, 13 ) ) );
	afterAll( () => jest.useRealTimers() );

	describe( 'en_US site', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'drops the year from a single day in the current year', () => {
			const date = utcDate( 2026, 7, 24 );
			expect( formatDateRangeMinimal( { from: date, to: date } ) ).toBe( 'Jul 24' );
		} );

		it( 'drops the year from a range inside the current year', () => {
			expect(
				formatDateRangeMinimal( { from: utcDate( 2026, 7, 13 ), to: utcDate( 2026, 7, 26 ) } )
			).toBe( `Jul 13${ SEP }26` );
		} );

		it( 'elides across months of the current year without naming it', () => {
			expect(
				formatDateRangeMinimal( { from: utcDate( 2026, 6, 21 ), to: utcDate( 2026, 7, 25 ) } )
			).toBe( `Jun 21${ SEP }Jul 25` );
		} );

		// A range elsewhere in time needs its year to say which one it is, so it
		// reads as the compact form rather than a shorter but ambiguous one.
		it( 'keeps the year on a range in an earlier year', () => {
			const range = { from: utcDate( 2025, 7, 13 ), to: utcDate( 2025, 7, 26 ) };

			expect( formatDateRangeMinimal( range ) ).toBe( formatDateRangeCompact( range ) );
		} );

		it( 'keeps the year on a range straddling the turn of the year', () => {
			const range = { from: utcDate( 2025, 12, 28 ), to: utcDate( 2026, 1, 3 ) };

			expect( formatDateRangeMinimal( range ) ).toBe( formatDateRangeCompact( range ) );
		} );
	} );

	describe( 'es_ES site', () => {
		beforeEach( () => setSettings( ES_ES_SETTINGS ) );

		// Dropping the year takes the "de" that introduced it along with it. Both
		// ends stay spelled out: Spanish abbreviated dates and CLDR's disagree.
		it( 'drops the year the way the locale writes the rest of the date', () => {
			expect(
				formatDateRangeMinimal( { from: utcDate( 2026, 7, 13 ), to: utcDate( 2026, 7, 26 ) } )
			).toBe( `13 de jul${ FALLBACK_SEP }26 de jul` );
		} );
	} );

	// A year-less range spanning two years leaves ICU nothing to tell them apart
	// by, so it puts a year back and such locales lose their elision.
	describe( 'hu_HU site', () => {
		beforeEach( () =>
			setSettings( settingsFor( 'hu-HU-test', 'Y. F j.', HU_MONTHS, undefined, HU_MONTHS_SHORT ) )
		);

		it( 'elides a range inside the current year', () => {
			expect(
				formatDateRangeMinimal( { from: utcDate( 2026, 7, 13 ), to: utcDate( 2026, 7, 26 ) } )
			).toBe( 'júl. 13–26.' );
		} );

		it( 'still spells out a range that needs its year', () => {
			expect(
				formatDateRangeMinimal( { from: utcDate( 2025, 7, 13 ), to: utcDate( 2025, 7, 26 ) } )
			).toBe( '2025. júl. 13–26.' );
		} );
	} );

	describe( 'edge cases', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'returns an empty string when an end is missing', () => {
			expect( formatDateRangeMinimal( { from: utcDate( 2026, 7, 13 ), to: undefined } ) ).toBe(
				''
			);
			expect( formatDateRangeMinimal() ).toBe( '' );
		} );

		// Nothing to abbreviate, but the year still comes off: the site's own
		// ordering is kept, exactly as the year-less single-date form does.
		it( 'still drops the year where the site numbers its month', () => {
			setSettings( settingsFor( 'en-numeric-minimal-test', 'd/m/Y' ) );

			expect(
				formatDateRangeMinimal( { from: utcDate( 2026, 7, 13 ), to: utcDate( 2026, 7, 26 ) } )
			).toBe( `13/07${ FALLBACK_SEP }26/07` );
		} );
	} );
} );

describe( 'formatDateRangeNatural', () => {
	beforeAll( () => jest.useFakeTimers().setSystemTime( utcDate( 2026, 8, 13 ) ) );
	afterAll( () => jest.useRealTimers() );

	describe( 'en_US site', () => {
		beforeEach( () => setSettings( EN_US_SETTINGS ) );

		it( 'names a whole calendar month', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2025, 3, 1 ), to: utcDate( 2025, 3, 31 ) } )
			).toBe( 'March 2025' );
		} );

		// The label is alone on the control, so the year is not redundant the way
		// it is in a range with both ends on screen.
		it( 'keeps the year on a whole month of the current year', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2026, 3, 1 ), to: utcDate( 2026, 3, 31 ) } )
			).toBe( 'March 2026' );
		} );

		it( 'names a whole calendar year', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2025, 1, 1 ), to: utcDate( 2025, 12, 31 ) } )
			).toBe( '2025' );
		} );

		it( 'measures the month by its own length', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2024, 2, 1 ), to: utcDate( 2024, 2, 29 ) } )
			).toBe( 'February 2024' );
		} );

		it( 'names the month whatever time of day the range ends at', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2025, 3, 1 ), to: utcDate( 2025, 3, 31, 23 ) } )
			).toBe( 'March 2025' );
		} );

		it( 'falls back on a range that stops short of the month', () => {
			const range = { from: utcDate( 2026, 3, 1 ), to: utcDate( 2026, 3, 30 ) };

			expect( formatDateRangeNatural( range ) ).toBe( formatDateRangeMinimal( range ) );
		} );

		it( 'falls back on February shortened to 28 days in a leap year', () => {
			const range = { from: utcDate( 2024, 2, 1 ), to: utcDate( 2024, 2, 28 ) };

			expect( formatDateRangeNatural( range ) ).toBe( formatDateRangeMinimal( range ) );
		} );

		// Two whole months name no single period, and the design asks for the
		// shortest form rather than a made-up one.
		it( 'falls back across two whole months', () => {
			const range = { from: utcDate( 2026, 3, 1 ), to: utcDate( 2026, 4, 30 ) };

			expect( formatDateRangeNatural( range ) ).toBe( formatDateRangeMinimal( range ) );
		} );

		it( 'falls back on a month-long window that sits between two months', () => {
			const range = { from: utcDate( 2026, 3, 15 ), to: utcDate( 2026, 4, 14 ) };

			expect( formatDateRangeNatural( range ) ).toBe( formatDateRangeMinimal( range ) );
		} );
	} );

	describe( 'es_ES site', () => {
		beforeEach( () => setSettings( ES_ES_SETTINGS ) );

		it( 'names a whole month the way the site orders its dates', () => {
			expect(
				formatDateRangeNatural( { from: utcDate( 2025, 3, 1 ), to: utcDate( 2025, 3, 31 ) } )
			).toBe( 'marzo de 2025' );
		} );
	} );

	it( 'returns an empty string when an end is missing', () => {
		setSettings( EN_US_SETTINGS );

		expect( formatDateRangeNatural( { from: utcDate( 2025, 3, 1 ), to: undefined } ) ).toBe( '' );
		expect( formatDateRangeNatural() ).toBe( '' );
	} );
} );

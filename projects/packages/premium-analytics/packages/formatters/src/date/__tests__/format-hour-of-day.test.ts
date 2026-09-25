/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatHourOfDay } from '../format-date';

const baseSettings = getSettings();

/**
 * Run with a site time format, locale, and timezone in place.
 *
 * @param timeFormat - PHP `time_format` value.
 * @param offset     - Site UTC offset in hours.
 * @param locale     - Site locale tag.
 */
function withSite( timeFormat: string, offset: number, locale = 'en' ) {
	setSettings( {
		...baseSettings,
		l10n: { ...baseSettings.l10n, locale },
		formats: { ...baseSettings.formats, time: timeFormat },
		timezone: {
			offset,
			string: '',
			abbr: '',
			offsetFormatted: String( offset ),
		},
	} as Parameters< typeof setSettings >[ 0 ] );
}

/**
 * The label with its spaces flattened.
 *
 * `Intl` separates the hour from its meridiem with a narrow no-break space, and
 * which space that is has moved between ICU versions.
 *
 * @param hour - Site-local hour, 0-23.
 * @return The label, with every space rendered as U+0020.
 */
function label( hour: number ): string {
	return formatHourOfDay( hour ).replace( /\s/g, ' ' );
}

describe( 'formatHourOfDay', () => {
	afterEach( () => setSettings( baseSettings ) );

	it( 'renders the hour alone, without the minutes the buckets never carry', () => {
		withSite( 'g:i a', 0 );

		expect( label( 19 ) ).toBe( '7 pm' );
		expect( label( 0 ) ).toBe( '12 am' );
	} );

	it( 'runs the clock to 24 when the site format names no 12-hour token', () => {
		withSite( 'H:i', 0 );

		expect( label( 19 ) ).toBe( '19' );
		expect( label( 7 ) ).toBe( '07' );
	} );

	it( 'preserves whether the site pads its hour', () => {
		withSite( 'G:i', 0 );
		expect( label( 7 ) ).toBe( '7' );

		withSite( 'H:i', 0, 'ja' );
		expect( label( 7 ) ).toBe( '07時' );
	} );

	it( 'does not add a meridiem the site format omits', () => {
		withSite( 'g:i', 0 );
		expect( label( 19 ) ).toBe( '7' );

		withSite( 'h:i', 0 );
		expect( label( 7 ) ).toBe( '07' );
	} );

	it( 'cases the meridiem the way the site format does', () => {
		withSite( 'g:i A', 0 );

		expect( label( 19 ) ).toBe( '7 PM' );
	} );

	it( 'answers midnight as 00 rather than 24 on a 24-hour clock', () => {
		withSite( 'H:i', 0 );

		expect( label( 0 ) ).toBe( '00' );
	} );

	it( 'keeps the unit a locale attaches to a bare hour', () => {
		withSite( 'H:i', 0, 'de_DE' );
		expect( label( 19 ) ).toBe( '19 Uhr' );

		withSite( 'H:i', 0, 'ja' );
		expect( label( 19 ) ).toBe( '19時' );
	} );

	it( 'does not shift the hour through the site timezone', () => {
		// The bucket is already site-local; converting it again would move it.
		withSite( 'g:i a', -8 );

		expect( label( 19 ) ).toBe( '7 pm' );
	} );

	it( 'does not read an escaped letter as a 12-hour token', () => {
		// fr_FR spells 19:30 as "19 h 30": the `h` is literal text, not a clock.
		withSite( 'G \\h i', 0 );

		expect( label( 19 ) ).toBe( '19' );
	} );

	it( 'falls back to a bare hour when the site locale is unusable', () => {
		withSite( 'H:i', 0, 'xx_YY' );
		expect( label( 19 ) ).toBe( '19' );

		withSite( 'g:i a', 0, 'xx_YY' );
		expect( label( 19 ) ).toBe( '7 pm' );
	} );

	it( 'runs to 24 when the site format is empty, rather than guessing a clock', () => {
		withSite( '', 0 );

		expect( label( 19 ) ).toBe( '19' );
	} );
} );

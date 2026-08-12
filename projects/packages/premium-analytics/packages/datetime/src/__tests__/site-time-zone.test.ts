/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteTimeZone } from '../site-time-zone';

/**
 * The package's own defaults, captured before any test installs settings over
 * them, so the "no settings installed" case asserts against what
 * `@wordpress/date` actually ships rather than a restated copy of it.
 */
const DEFAULTS = getSettings();

/**
 * Install settings carrying a specific timezone.
 *
 * @param timezone        - The `timezone` block WordPress would send.
 * @param timezone.offset - Offset in hours.
 * @param timezone.string - IANA zone name, empty for offset-configured sites.
 */
const withTimezone = ( timezone: { offset: number; string: string } ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { ...timezone, offsetFormatted: String( timezone.offset ), abbr: '' },
	} );

describe( 'siteTimeZone', () => {
	it( 'prefers the named timezone', () => {
		withTimezone( { offset: 2, string: 'Europe/Amsterdam' } );

		expect( siteTimeZone() ).toBe( 'Europe/Amsterdam' );
	} );

	// A site set to a manual UTC offset rather than a city has no timezone
	// string at all, so the offset is the only thing left to go on.
	it( 'falls back to the offset when there is no named timezone', () => {
		withTimezone( { offset: 8, string: '' } );

		expect( siteTimeZone() ).toBe( '+08:00' );
	} );

	it( 'formats a negative offset', () => {
		withTimezone( { offset: -5, string: '' } );

		expect( siteTimeZone() ).toBe( '-05:00' );
	} );

	it( 'formats a fractional offset', () => {
		withTimezone( { offset: 5.5, string: '' } );

		expect( siteTimeZone() ).toBe( '+05:30' );
	} );

	it( 'formats a negative fractional offset', () => {
		withTimezone( { offset: -3.5, string: '' } );

		expect( siteTimeZone() ).toBe( '-03:30' );
	} );

	it( 'formats a zero offset', () => {
		withTimezone( { offset: 0, string: '' } );

		expect( siteTimeZone() ).toBe( '+00:00' );
	} );

	// The visitor's zone is never the right answer for a site-scoped value, so
	// the no-settings path has to land on UTC for everyone alike.
	it( 'resolves to UTC when WordPress installed no settings', () => {
		setSettings( DEFAULTS );

		expect( siteTimeZone() ).toBe( '+00:00' );
	} );
} );

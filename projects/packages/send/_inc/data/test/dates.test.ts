import {
	addDays,
	calendarLocale,
	dayLabel,
	daysBetween,
	emailTime,
	isYmd,
	localDay,
	parseUtc,
	ymdOf,
} from '../dates';

// @wordpress/date's default settings: UTC, `g:i a` times.
const NOW = Date.UTC( 2026, 9, 18, 12, 0 );

describe( 'emailTime', () => {
	it.each( [
		[ 'under a minute', '2026-10-18 11:59:40', 'just now' ],
		[ 'minutes', '2026-10-18 11:48:00', '12 min ago' ],
		[ 'hours', '2026-10-18 08:30:00', '3 hours ago' ],
		[ 'a day or more, without seconds', '2026-10-17 04:18:26', 'Oct 17, 4:18 am' ],
		[ 'another year', '2025-12-30 16:05:00', 'Dec 30, 2025, 4:05 pm' ],
	] )( 'says %s', ( _, value, expected ) => {
		expect( emailTime( parseUtc( value ), NOW ) ).toBe( expected );
	} );
} );

describe( 'dayLabel', () => {
	it( 'shows the day the server worked out, whatever the browser’s timezone', () => {
		expect( dayLabel( '2026-11-01' ) ).toBe( 'Nov 1' );
		expect( dayLabel( '2026-10-13', 'D, M j' ) ).toBe( 'Tue, Oct 13' );
		expect( dayLabel( 'soon' ) ).toBe( '' );
	} );
} );

describe( 'day arithmetic', () => {
	it( 'moves across months, years and the clocks changing', () => {
		expect( addDays( '2026-10-19', -89 ) ).toBe( '2026-07-22' );
		expect( addDays( '2026-12-31', 1 ) ).toBe( '2027-01-01' );
		expect( addDays( '2026-03-29', 1 ) ).toBe( '2026-03-30' );
		expect( daysBetween( '2025-10-20', '2026-10-19' ) ).toBe( 364 );
	} );

	it( 'rejects days that don’t exist', () => {
		expect( isYmd( '2026-02-29' ) ).toBe( false );
		expect( isYmd( '2028-02-29' ) ).toBe( true );
		expect( isYmd( 20261019 ) ).toBe( false );
		expect( addDays( '2026-02-30', 1 ) ).toBe( '' );
	} );

	it( 'gives the calendar a local midnight and reads the same day back', () => {
		const day = localDay( '2026-10-19' );
		expect( [ day.getHours(), day.getDate() ] ).toEqual( [ 0, 19 ] );
		expect( ymdOf( day ) ).toBe( '2026-10-19' );
	} );
} );

describe( 'calendarLocale', () => {
	it.each( [
		[ 'fr_FR', 'fr-FR' ],
		[ 'de_DE_formal', 'de-DE' ],
		[ 'pt_PT_ao90', 'pt-PT' ],
		[ 'es_419', 'es-419' ],
		[ 'ca', 'ca' ],
		[ '', 'en-US' ],
	] )( 'reads %p as %p', ( locale, tag ) => {
		expect( calendarLocale( locale ) ).toBe( tag );
	} );
} );

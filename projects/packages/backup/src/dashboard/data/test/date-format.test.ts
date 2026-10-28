import { getSettings, setSettings } from '@wordpress/date';
import { formatDate, formatDateTime, formatTime } from '../date-format';

const original = getSettings();

afterEach( () => {
	setSettings( original );
} );

describe( 'date formats', () => {
	it.each( [
		[
			'core defaults',
			{ date: 'F j, Y', time: 'g:i a' },
			[ 'August 12, 2026 5:20 pm', 'August 12, 2026', '5:20 pm' ],
		],
		[
			'a 24-hour site, so it never sees am or pm',
			{ date: 'j M Y', time: 'H:i' },
			[ '12 Aug 2026 17:20', '12 Aug 2026', '17:20' ],
		],
	] )( 'follows the site settings: %s', ( _name, formats, [ dateTime, day, time ] ) => {
		setSettings( { ...original, formats: { ...original.formats, ...formats } } );

		expect( formatDateTime( '2026-08-12T17:20:00Z' ) ).toBe( dateTime );
		expect( formatDate( '2026-08-12T17:20:00Z' ) ).toBe( day );
		expect( formatTime( '2026-08-12T17:20:00Z' ) ).toBe( time );
	} );
} );

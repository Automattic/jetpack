import { getSettings, setSettings } from '@wordpress/date';
import { formatRowDate } from '../row-date';

const NOW = new Date( '2026-10-06T12:00:00Z' );

describe( 'formatRowDate', () => {
	test.each( [
		[ '2026-10-06T07:00:00Z', 'Today, 7:00 AM' ],
		[ '2026-10-05T23:59:00Z', 'Yesterday, 11:59 PM' ],
		[ '2026-10-04T23:59:00Z', 'Oct 4, 2026, 11:59 PM' ],
		// Month boundary: the day before the 1st is the last of the previous month.
		[ '2026-09-30T08:00:00Z', 'Sep 30, 2026, 8:00 AM' ],
	] )( 'formats %s as %s', ( published, expected ) => {
		expect( formatRowDate( published, NOW ) ).toBe( expected );
	} );

	test.each( [
		// 08:00 UTC is 9:00 PM the evening before in Auckland (UTC+13 in October).
		[ 'Pacific/Auckland', 13, '2026-10-06T08:00:00Z', 'Yesterday, 9:00 PM' ],
		// 03:00 UTC is 8:00 PM the evening before in Los Angeles (UTC-7 in October).
		[ 'America/Los_Angeles', -7, '2026-10-06T03:00:00Z', 'Yesterday, 8:00 PM' ],
	] )( 'uses the site day, not the UTC day, in %s', ( string, offset, published, expected ) => {
		const original = getSettings();
		setSettings( { ...original, timezone: { offset, offsetFormatted: '', string, abbr: '' } } );
		try {
			expect( formatRowDate( published, NOW ) ).toBe( expected );
		} finally {
			setSettings( original );
		}
	} );

	test( 'steps back over a month boundary', () => {
		expect( formatRowDate( '2026-09-30T08:00:00Z', new Date( '2026-10-01T10:00:00Z' ) ) ).toBe(
			'Yesterday, 8:00 AM'
		);
	} );
} );

import { getSettings, setSettings } from '@wordpress/date';
import { formatRowDate } from '../row-date';

const NOW = new Date( '2026-10-06T12:00:00Z' );

describe( 'formatRowDate', () => {
	test.each( [
		[ '2026-10-06T07:00:00Z', 'Today, 7:00 am' ],
		[ '2026-10-05T23:59:00Z', 'Yesterday, 11:59 pm' ],
		[ '2026-10-04T23:59:00Z', 'October 4, 2026 11:59 pm' ],
	] )( 'formats %s as %s', ( published, expected ) => {
		expect( formatRowDate( published, NOW ) ).toBe( expected );
	} );

	test.each( [
		// 08:00 UTC is 9:00 PM the evening before in Auckland (UTC+13 in October).
		[ 'Pacific/Auckland', 13, '2026-10-06T08:00:00Z', 'Yesterday, 9:00 pm' ],
		// 03:00 UTC is 8:00 PM the evening before in Los Angeles (UTC-7 in October).
		[ 'America/Los_Angeles', -7, '2026-10-06T03:00:00Z', 'Yesterday, 8:00 pm' ],
	] )( 'uses the site day, not the UTC day, in %s', ( string, offset, published, expected ) => {
		const original = getSettings();
		setSettings( { ...original, timezone: { offset, offsetFormatted: '', string, abbr: '' } } );
		try {
			expect( formatRowDate( published, NOW ) ).toBe( expected );
		} finally {
			setSettings( original );
		}
	} );

	test( 'uses the site date and time formats', () => {
		const original = getSettings();
		setSettings( {
			...original,
			formats: { ...original.formats, date: 'j M Y', time: 'H:i' },
		} );
		try {
			expect( formatRowDate( '2026-10-06T17:00:00Z', NOW ) ).toBe( 'Today, 17:00' );
			expect( formatRowDate( '2026-10-04T17:00:00Z', NOW ) ).toBe( '4 Oct 2026 17:00' );
		} finally {
			setSettings( original );
		}
	} );

	test( 'steps back over a month boundary', () => {
		expect( formatRowDate( '2026-09-30T08:00:00Z', new Date( '2026-10-01T10:00:00Z' ) ) ).toBe(
			'Yesterday, 8:00 am'
		);
	} );
} );

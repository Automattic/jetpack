/**
 * Internal dependencies
 */
import { emailSendWindowParams } from '../email-send-window';

const NOW = new Date( '2030-01-01T12:00:00Z' );
const DAY = '2026-06-22T00:00:00Z';

const iso = ( value: string | undefined ) => new Date( value ?? '' ).toISOString();

describe( 'emailSendWindowParams', () => {
	it.each( [
		[ 'first-week', 'day', 'UTC', DAY, '2026-06-28T23:59:59.999Z' ],
		[ 'first-30-days', 'day', 'UTC', DAY, '2026-07-21T23:59:59.999Z' ],
		// June 2026 is the first of the 30 calendar months, November 2028 the last.
		[ 'all-time', 'month', 'UTC', DAY, '2028-11-30T23:59:59.999Z' ],
		// Day 30 across the end of DST, in a site zone the machine is not in.
		[
			'first-30-days',
			'day',
			'America/New_York',
			'2026-10-20T04:00:00Z',
			'2026-11-19T04:59:59.999Z',
		],
	] as const )(
		'reads the %s window by the %s in %s from the send day through its reach',
		( window, interval, timeZone, day, end ) => {
			const params = emailSendWindowParams( window, { day }, timeZone, NOW );

			expect( params?.interval ).toBe( interval );
			expect( iso( params?.from ) ).toBe( iso( day ) );
			expect( iso( params?.to ) ).toBe( end );
		}
	);

	it.each( [
		// From the hour of a 14:16 send to the same hour a day later.
		[ '2026-06-22T14:16:17Z', '2026-06-22T14:00:00.000Z', '2026-06-23T13:59:59.999Z' ],
		// A host that knows only the day gets that day.
		[ undefined, '2026-06-22T00:00:00.000Z', '2026-06-22T23:59:59.999Z' ],
	] )( 'reads the first 24 hours by the hour from a send at %s', ( sentAt, from, to ) => {
		const params = emailSendWindowParams( 'first-24-hours', { day: DAY, sentAt }, 'UTC', NOW );

		expect( params?.interval ).toBe( 'hour' );
		expect( iso( params?.from ) ).toBe( from );
		expect( iso( params?.to ) ).toBe( to );
	} );

	it( 'ends today for a send younger than the reach', () => {
		const params = emailSendWindowParams(
			'all-time',
			{ day: DAY },
			'UTC',
			new Date( '2026-08-28T12:00:00Z' )
		);

		expect( iso( params?.to ) ).toBe( '2026-08-28T23:59:59.999Z' );
	} );

	it( 'answers nothing without a readable send day', () => {
		expect(
			emailSendWindowParams( 'first-30-days', { day: undefined }, 'UTC', NOW )
		).toBeUndefined();
		expect( emailSendWindowParams( 'first-30-days', { day: 'soon' }, 'UTC', NOW ) ).toBeUndefined();
	} );
} );

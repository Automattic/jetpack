/**
 * Internal dependencies
 */
import { emailSendWindowParams } from '../email-send-window';

const NOW = new Date( '2030-01-01T12:00:00Z' );

describe( 'emailSendWindowParams', () => {
	it.each( [
		[ 'hour', 'UTC', '2026-06-22T00:00:00Z', '2026-06-22T23:59:59.999Z' ],
		[ 'day', 'UTC', '2026-06-22T00:00:00Z', '2026-07-21T23:59:59.999Z' ],
		// June 2026 is the first of the 30 calendar months, November 2028 the last.
		[ 'month', 'UTC', '2026-06-22T00:00:00Z', '2028-11-30T23:59:59.999Z' ],
		// Day 30 across the end of DST, in a site zone the machine is not in.
		[ 'day', 'America/New_York', '2026-10-20T04:00:00Z', '2026-11-19T04:59:59.999Z' ],
	] as const )(
		'ends a %s window in %s where its reach does',
		( interval, timeZone, sentAt, end ) => {
			const params = emailSendWindowParams( interval, sentAt, timeZone, NOW );

			expect( params?.interval ).toBe( interval );
			expect( new Date( params?.from ?? '' ).toISOString() ).toBe(
				new Date( sentAt ).toISOString()
			);
			expect( new Date( params?.to ?? '' ).toISOString() ).toBe( end );
		}
	);

	it( 'ends today for a send younger than the reach', () => {
		const params = emailSendWindowParams(
			'month',
			'2026-06-22T00:00:00Z',
			'UTC',
			new Date( '2026-08-28T12:00:00Z' )
		);

		expect( new Date( params?.to ?? '' ).toISOString() ).toBe( '2026-08-28T23:59:59.999Z' );
	} );

	it( 'answers nothing without a readable send day', () => {
		expect( emailSendWindowParams( 'day', undefined, 'UTC', NOW ) ).toBeUndefined();
		expect( emailSendWindowParams( 'day', 'soon', 'UTC', NOW ) ).toBeUndefined();
	} );
} );

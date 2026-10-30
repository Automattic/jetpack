/**
 * Internal dependencies
 */
import { isRepeatedHour } from '../repeated-hour';

describe( 'isRepeatedHour', () => {
	it.each( [
		[
			'the first pass through the fall-back hour',
			'2026-11-01T05:30:00Z',
			'America/New_York',
			true,
		],
		[ 'the second pass through it', '2026-11-01T06:30:00Z', 'America/New_York', true ],
		[ 'the hour before it', '2026-11-01T04:30:00Z', 'America/New_York', false ],
		[ 'the hour after it', '2026-11-01T07:30:00Z', 'America/New_York', false ],
		[ 'the hour after the spring-forward gap', '2026-03-08T07:30:00Z', 'America/New_York', false ],
		[ 'a fixed offset on the same night', '2026-11-01T06:30:00Z', '-05:00', false ],
	] )( '%s', ( _name, instant, zone, expected ) => {
		expect( isRepeatedHour( new Date( instant ), zone ) ).toBe( expected );
	} );
} );

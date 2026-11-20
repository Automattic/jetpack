import { formatDuration } from '../durations';

describe( 'formatDuration', () => {
	it.each( [
		[ 1651, 'short', '28 min' ],
		[ 20, 'short', '1 min' ],
		[ 3570, 'short', '1 hr' ],
		[ 20670, 'long', '5.7 hours' ],
	] as const )( 'formats %d seconds as %s: %s', ( seconds, display, expected ) => {
		expect( formatDuration( seconds, display ) ).toBe( expected );
	} );
} );

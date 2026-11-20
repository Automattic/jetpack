import { formatPeriod } from '../earnings-card';

describe( 'formatPeriod', () => {
	it.each( [
		// Local midnight on the 1st is the previous month west of UTC.
		[ '2026-01', 'January 2026' ],
		[ 'N/A', 'N/A' ],
	] )( 'labels %s as %s', ( period, expected ) => {
		expect( formatPeriod( period ) ).toBe( expected );
	} );
} );

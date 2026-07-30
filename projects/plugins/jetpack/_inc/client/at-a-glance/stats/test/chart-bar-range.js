import { chartBarRange } from '../chart-bar-range';

// Bar dates reach the helper the way `statsChart` encodes them: the calendar day
// from the Stats API, as UTC midnight.
const barDate = day => `${ day }T00:00:00.000Z`;

describe( 'chartBarRange', () => {
	it( 'covers just the one day on the Days tab', () => {
		expect( chartBarRange( barDate( '2026-07-29' ), 'day' ) ).toEqual( {
			from: '2026-07-29',
			to: '2026-07-29',
		} );
	} );

	it( 'covers seven days from the bar on the Weeks tab', () => {
		expect( chartBarRange( barDate( '2026-07-27' ), 'week' ) ).toEqual( {
			from: '2026-07-27',
			to: '2026-08-02',
		} );
	} );

	it( 'covers the whole calendar month on the Months tab', () => {
		expect( chartBarRange( barDate( '2026-07-01' ), 'month' ) ).toEqual( {
			from: '2026-07-01',
			to: '2026-07-31',
		} );
	} );

	// The Stats API keys month bars on the first of the month, but the range must
	// not depend on that.
	it( 'expands a mid-month date to the whole month', () => {
		expect( chartBarRange( barDate( '2026-07-16' ), 'month' ) ).toEqual( {
			from: '2026-07-01',
			to: '2026-07-31',
		} );
	} );

	it.each( [
		[ '30-day month', '2026-06-14', '2026-06-01', '2026-06-30' ],
		[ 'February in a common year', '2026-02-10', '2026-02-01', '2026-02-28' ],
		[ 'February in a leap year', '2028-02-10', '2028-02-01', '2028-02-29' ],
		[ 'December', '2026-12-05', '2026-12-01', '2026-12-31' ],
	] )( 'gets the last day right for a %s', ( _label, day, from, to ) => {
		expect( chartBarRange( barDate( day ), 'month' ) ).toEqual( { from, to } );
	} );

	it( 'crosses a year boundary on the Weeks tab', () => {
		expect( chartBarRange( barDate( '2026-12-28' ), 'week' ) ).toEqual( {
			from: '2026-12-28',
			to: '2027-01-03',
		} );
	} );

	// A site west of UTC would read the previous day out of a UTC-midnight
	// instant if the helper used local date components.
	it( 'reads the calendar day in UTC regardless of the browser timezone', () => {
		const originalOffset = Date.prototype.getTimezoneOffset;
		// Pretend the browser is UTC-8.
		Date.prototype.getTimezoneOffset = () => 480;

		try {
			expect( chartBarRange( barDate( '2026-07-29' ), 'day' ) ).toEqual( {
				from: '2026-07-29',
				to: '2026-07-29',
			} );
		} finally {
			Date.prototype.getTimezoneOffset = originalOffset;
		}
	} );

	it( 'treats an unrecognized unit as a single day', () => {
		expect( chartBarRange( barDate( '2026-07-29' ), 'decade' ) ).toEqual( {
			from: '2026-07-29',
			to: '2026-07-29',
		} );
	} );

	it.each( [
		[ 'an unparseable date', 'not-a-date' ],
		[ 'an empty string', '' ],
		[ 'undefined', undefined ],
	] )( 'returns undefined for %s, so no range is applied', ( _label, value ) => {
		expect( chartBarRange( value, 'day' ) ).toBeUndefined();
	} );
} );

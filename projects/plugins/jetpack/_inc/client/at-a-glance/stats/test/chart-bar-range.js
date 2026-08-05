import { chartBarRange } from '../chart-bar-range';

// Bar dates reach the helper the way `statsChart` encodes them: the calendar day
// from the Stats API, as UTC midnight.
const barDate = day => `${ day }T00:00:00.000Z`;

// Every case pins an explicit date, so nothing here depends on the clock. The
// helper reads and writes UTC components only, so nothing depends on the
// machine's timezone either — the suite is run under several to prove it.
describe( 'chartBarRange', () => {
	it.each( [
		[ 'day', '2026-07-29', '2026-07-29', '2026-07-29' ],
		// A week is the seven days from the bar, not a locale-defined week — the
		// Stats API keys week bars on their own first day, so there is no
		// start-of-week rule to get wrong.
		[ 'week', '2026-07-27', '2026-07-27', '2026-08-02' ],
		[ 'week', '2026-12-28', '2026-12-28', '2027-01-03' ],
		[ 'month', '2026-07-01', '2026-07-01', '2026-07-31' ],
		// Month bars are keyed on the 1st, but the range must not rely on that.
		[ 'month', '2026-07-16', '2026-07-01', '2026-07-31' ],
		[ 'month', '2026-06-14', '2026-06-01', '2026-06-30' ],
		[ 'month', '2026-02-10', '2026-02-01', '2026-02-28' ],
		[ 'month', '2028-02-10', '2028-02-01', '2028-02-29' ],
		[ 'month', '2026-12-05', '2026-12-01', '2026-12-31' ],
		// An unrecognized tab is treated as a single day rather than guessing.
		[ 'decade', '2026-07-29', '2026-07-29', '2026-07-29' ],
	] )( 'covers %s from %s as %s..%s', ( unit, day, from, to ) => {
		expect( chartBarRange( barDate( day ), unit ) ).toEqual( { from, to } );
	} );

	it.each( [
		[ 'an unparseable date', 'not-a-date' ],
		[ 'an empty string', '' ],
		[ 'undefined', undefined ],
	] )( 'returns undefined for %s, so no range is applied', ( _label, value ) => {
		expect( chartBarRange( value, 'day' ) ).toBeUndefined();
	} );
} );

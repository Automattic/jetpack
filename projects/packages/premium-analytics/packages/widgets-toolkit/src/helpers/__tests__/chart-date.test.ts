/**
 * Internal dependencies
 */
import { toChartDate } from '../chart-date';

describe( 'toChartDate', () => {
	// The stamps carry a nominal `+00:00` rather than a real offset, so keeping it
	// would shift every label by the viewer's own offset.
	it( 'reads a stamp as the wall clock it names, not as an instant', () => {
		const date = toChartDate( '2026-06-29T09:00:00+00:00' );

		expect( date.getFullYear() ).toBe( 2026 );
		expect( date.getMonth() ).toBe( 5 );
		expect( date.getDate() ).toBe( 29 );
		expect( date.getHours() ).toBe( 9 );
	} );

	// `getRowIntervalFields` forwards `row.date_start` verbatim when the API
	// supplies it, so the shapes that arrive here are not only the ones this
	// package stamps itself. A bare date parsed as-is would land in UTC, and a
	// space-separated stamp would not parse at all.
	it.each( [
		[ 'a bare date', '2026-06-29', 0 ],
		[ 'a space-separated stamp', '2026-06-29 09:00:00', 9 ],
		[ 'a T-separated stamp', '2026-06-29T09:00:00', 9 ],
	] )( 'reads %s in local wall-clock terms', ( _label, stamp, expectedHour ) => {
		const date = toChartDate( stamp as string );

		expect( Number.isNaN( date.getTime() ) ).toBe( false );
		expect( date.getDate() ).toBe( 29 );
		expect( date.getHours() ).toBe( expectedHour );
	} );
} );

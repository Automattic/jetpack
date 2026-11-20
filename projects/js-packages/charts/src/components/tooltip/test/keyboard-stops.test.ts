import { getKeyboardStops } from '../private/keyboard-stops';

describe( 'getKeyboardStops', () => {
	it( 'gives a stop past the last date no members, even for undated points', () => {
		const stops = getKeyboardStops( [
			{ label: 'Dated', data: [ { date: new Date( '2025-04-01T00:00:00Z' ), value: 1 } ] },
			{ label: 'Undated', data: [ { label: 'Apr', value: 2 } ] },
		] );

		expect( stops.count ).toBe( 1 );
		expect( stops.membersAt( 1 ) ).toEqual( [] );
	} );

	it( 'steps through array indexes when no point has a date', () => {
		const first = {
			label: 'First',
			data: [
				{ label: 'Jan', value: 1 },
				{ label: 'Feb', value: 2 },
			],
		};
		const second = { label: 'Second', data: [ { label: 'Jan', value: 3 } ] };
		const stops = getKeyboardStops( [ first, second ] );

		expect( stops.count ).toBe( 2 );
		expect( stops.membersAt( 0 ).map( ( { series, index } ) => [ series.label, index ] ) ).toEqual(
			[
				[ 'First', 0 ],
				[ 'Second', 0 ],
			]
		);
		expect( stops.membersAt( 1 ).map( ( { series, index } ) => [ series.label, index ] ) ).toEqual(
			[ [ 'First', 1 ] ]
		);
	} );
} );

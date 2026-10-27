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
} );

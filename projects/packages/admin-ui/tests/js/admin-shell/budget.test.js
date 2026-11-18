import { liveAppLimit } from '../../../src/admin-shell/budget';

describe( 'liveAppLimit', () => {
	it.each( [
		[ 'is 3 on 2 GB or less', null, 2, 3 ],
		[ 'is 6 on 4 GB', null, 4, 6 ],
		[ 'is 6 just under 8 GB', null, 7, 6 ],
		[ 'is unlimited on 8 GB', null, 8, Infinity ],
		[ 'is 6 when the browser does not report memory', null, undefined, 6 ],
		[ 'takes the site override', 4, 8, 4 ],
		[ 'ignores a zero override', 0, 2, 3 ],
		[ 'ignores a fractional override', 2.5, 2, 3 ],
	] )( '%s', ( _, override, deviceMemory, expected ) => {
		expect( liveAppLimit( override, { deviceMemory } ) ).toBe( expected );
	} );
} );

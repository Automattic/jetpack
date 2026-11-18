import { liveAppLimit, mayPrewarm } from '../../../src/admin-shell/budget';

describe( 'mayPrewarm', () => {
	it.each( [
		[ 'prewarms with nothing reported', {}, true ],
		[ 'prewarms on 3G with 4 GB', { deviceMemory: 4, connection: { effectiveType: '3g' } }, true ],
		[ 'waits with Save-Data on', { connection: { saveData: true, effectiveType: '4g' } }, false ],
		[ 'waits on 2 GB or less', { deviceMemory: 2 }, false ],
		[ 'waits on 2G', { connection: { effectiveType: '2g' } }, false ],
		[ 'waits on slow 2G', { connection: { effectiveType: 'slow-2g' } }, false ],
	] )( '%s', ( _, nav, expected ) => {
		expect( mayPrewarm( nav ) ).toBe( expected );
	} );
} );

describe( 'liveAppLimit', () => {
	it.each( [
		[ 'is 3 on 2 GB or less', null, 2, 3 ],
		[ 'is 10 on 4 GB', null, 4, 10 ],
		[ 'is 10 just under 8 GB', null, 7, 10 ],
		[ 'is unlimited on 8 GB', null, 8, Infinity ],
		[ 'is 10 when the browser does not report memory', null, undefined, 10 ],
		[ 'takes the site override', 4, 8, 4 ],
		[ 'ignores a zero override', 0, 2, 3 ],
		[ 'ignores a fractional override', 2.5, 2, 3 ],
	] )( '%s', ( _, override, deviceMemory, expected ) => {
		expect( liveAppLimit( override, { deviceMemory } ) ).toBe( expected );
	} );
} );

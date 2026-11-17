import { nextRotation } from '../upsell-rotation';

const HOUR = 60 * 60 * 1000;
const NOW = 1_000 * HOUR;

describe( 'nextRotation', () => {
	it.each( [
		[ 'starts at the site’s variant', null, { variant: 4, shownAt: NOW, seen: [ 4 ] } ],
		[
			'keeps the same copy within a day',
			{ variant: 5, shownAt: NOW - 23 * HOUR, seen: [ 4, 5 ] },
			{ variant: 5, shownAt: NOW - 23 * HOUR, seen: [ 4, 5 ] },
		],
		[
			'moves to the next copy after a day',
			{ variant: 5, shownAt: NOW - 24 * HOUR, seen: [ 4, 5 ] },
			{ variant: 6, shownAt: NOW, seen: [ 4, 5, 6 ] },
		],
		[
			'wraps past the last variant, skipping seen ones',
			{ variant: 8, shownAt: NOW - 25 * HOUR, seen: [ 1, 4, 5, 6, 7, 8 ] },
			{ variant: 2, shownAt: NOW, seen: [ 1, 4, 5, 6, 7, 8, 2 ] },
		],
		[
			'moves on when the copy was shown in the future',
			{ variant: 5, shownAt: NOW + 48 * HOUR, seen: [ 4, 5 ] },
			{ variant: 6, shownAt: NOW, seen: [ 4, 5, 6 ] },
		],
		[
			'starts a new cycle once every variant was shown',
			{ variant: 3, shownAt: NOW - 25 * HOUR, seen: [ 4, 5, 6, 7, 8, 1, 2, 3 ] },
			{ variant: 4, shownAt: NOW, seen: [ 4 ] },
		],
	] )( '%s', ( _, stored, expected ) => {
		expect( nextRotation( stored, 4, 8, NOW ) ).toEqual( expected );
	} );
} );

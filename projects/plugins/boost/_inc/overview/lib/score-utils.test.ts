import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatScoreDelta, getScoreDelta, getScoreTier, getTrendDirection } from './score-utils';

test.each( [
	[ 0, 'poor' ],
	[ 50, 'poor' ],
	[ 51, 'medium' ],
	[ 70, 'medium' ],
	[ 71, 'good' ],
	[ 100, 'good' ],
] )( 'keeps the existing score tier at %i', ( score, tier ) => {
	expect( getScoreTier( Number( score ) ) ).toBe( tier );
} );

test.each( [
	[ 25, 'F' ],
	[ 35, 'E' ],
	[ 50, 'D' ],
	[ 75, 'C' ],
	[ 90, 'B' ],
	[ 91, 'A' ],
] )( 'keeps the existing overall grade at %i', ( score, grade ) => {
	expect( getScoreLetter( Number( score ), Number( score ) ) ).toBe( grade );
} );

test( 'distinguishes missing baselines from zero and formats improvements', () => {
	expect( getScoreDelta( 80, null ) ).toBeNull();
	expect( getScoreDelta( 80 ) ).toBeNull();
	expect( getScoreDelta( 80, 0 ) ).toBe( 80 );
	expect( getScoreDelta( 80.2, 70 ) ).toBe( 10 );
	expect( formatScoreDelta( 1 ) ).toBe( '+1 point compared with Boost disabled' );
	expect( formatScoreDelta( 10 ) ).toBe( '+10 points compared with Boost disabled' );
	expect( [ 1, -1, 0 ].map( getTrendDirection ) ).toEqual( [ 'up', 'down', 'neutral' ] );
} );

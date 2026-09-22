import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { getLocaleData, resetLocaleData, setLocaleData } from '@wordpress/i18n';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreTier,
	getScoreTierColor,
	getScoreTierLabel,
} from './score-utils';

test( 'uses the shared score card color tokens for each tier', () => {
	expect( getScoreTierColor( 'good' ) ).toBe( 'var(--jetpack-boost-score-good)' );
	expect( getScoreTierColor( 'medium' ) ).toBe( 'var(--jetpack-boost-score-medium)' );
	expect( getScoreTierColor( 'poor' ) ).toBe( 'var(--jetpack-boost-score-poor)' );
} );

test.each( [
	[ 0, 'poor' ],
	[ 39, 'poor' ],
	[ 40, 'medium' ],
	[ 60, 'medium' ],
	[ 61, 'good' ],
	[ 100, 'good' ],
] )( 'assigns the modern score tier at %i', ( score, tier ) => {
	expect( getScoreTier( Number( score ) ) ).toBe( tier );
} );

test.each( [
	[ 'good', 'Good' ],
	[ 'medium', 'Could improve' ],
	[ 'poor', 'Poor' ],
] as const )( 'labels the %s tier', ( tier, label ) => {
	expect( getScoreTierLabel( tier ) ).toBe( label );
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
	expect( formatScoreDelta( 1 ) ).toBe( '+1 point' );
	expect( formatScoreDelta( 10 ) ).toBe( '+10 points' );
	expect( formatScoreDelta( 0 ) ).toBe( '0 points' );
	expect( formatScoreDelta( -10 ) ).toBe( '-10 points' );
} );

test( 'formats signed deltas using translated plural forms', () => {
	const localeData = getLocaleData( 'jetpack-boost' );
	try {
		setLocaleData(
			{
				'': {
					'plural-forms':
						'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
				},
				'%s point': [ '%s punkt', '%s punkty', '%s punktów' ],
			},
			'jetpack-boost'
		);
		for ( const [ delta, word ] of [
			[ 1, 'punkt' ],
			[ 2, 'punkty' ],
			[ 5, 'punktów' ],
		] as const ) {
			expect( formatScoreDelta( delta ) ).toBe( `+${ delta } ${ word }` );
			expect( formatScoreDelta( -delta ) ).toBe( `-${ delta } ${ word }` );
		}
	} finally {
		resetLocaleData( localeData, 'jetpack-boost' );
	}
} );

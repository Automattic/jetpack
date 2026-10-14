import { MIN_BACKGROUND_CONTRAST } from '../../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../../providers/chart-context/private/perceptual-color';
import { getOverlapColors } from '../overlap-colors';

const ADMIN_ACCENTS = [
	'#007cba',
	'#3858e9',
	'#437aa8',
	'#916745',
	'#646c3e',
	'#cf4339',
	'#567958',
	'#ad631e',
];

describe( 'getOverlapColors', () => {
	it.each( ADMIN_ACCENTS )( 'keeps every adjacent pair at 3:1 for %s', accent => {
		const colors = getOverlapColors( { outer: accent, inner: accent, background: '#ffffff' } );

		expect( colors ).not.toBeNull();
		expect( contrastRatio( colors!.outerOutline, '#ffffff' ) ).toBeGreaterThanOrEqual(
			MIN_BACKGROUND_CONTRAST
		);
		expect( contrastRatio( colors!.innerFill, colors!.outerFill ) ).toBeGreaterThanOrEqual(
			MIN_BACKGROUND_CONTRAST
		);
		expect( contrastRatio( '#1e1e1e', colors!.outerFill ) ).toBeGreaterThanOrEqual(
			MIN_BACKGROUND_CONTRAST
		);
	} );

	it.each( [
		[ 'the series matches the background', '#ffffff', '#ffffff', '#ffffff' ],
		[ 'the outline cannot stand off the background', '#d0d0d0', '#3858e9', '#ffffff' ],
		[ 'no tint separates the inner bar', '#3858e9', '#e8ecfd', '#ffffff' ],
	] )( 'returns null when %s', ( _, outer, inner, background ) => {
		expect( getOverlapColors( { outer, inner, background } ) ).toBeNull();
	} );

	it( 'holds 3:1 on a dark background', () => {
		const colors = getOverlapColors( {
			outer: '#86a9ff',
			inner: '#86a9ff',
			background: '#1e1e1e',
		} );

		expect( colors ).not.toBeNull();
		expect( contrastRatio( colors!.outerOutline, '#1e1e1e' ) ).toBeGreaterThanOrEqual(
			MIN_BACKGROUND_CONTRAST
		);
		expect( contrastRatio( colors!.innerFill, colors!.outerFill ) ).toBeGreaterThanOrEqual(
			MIN_BACKGROUND_CONTRAST
		);
	} );

	it( 'returns null for a color it cannot do math on', () => {
		expect(
			getOverlapColors( { outer: 'var(--x)', inner: '#3858e9', background: '#ffffff' } )
		).toBeNull();
	} );
} );

import { createPaletteGenerator, MIN_BACKGROUND_CONTRAST } from '../private/palette-generator';
import { contrastRatio, hexToViews, viewDistance } from '../private/perceptual-color';

const WP_ADMIN_ACCENTS = [ '#3858e9', '#04a4cc', '#a3b745', '#e14d43', '#9ebaa0', '#dd823b' ];
const PALETTE_SIZE = 6;

const paletteOf = ( seeds: string[], background: string, size = PALETTE_SIZE ): string[] => {
	const colorAt = createPaletteGenerator( seeds, background );
	return Array.from( { length: size }, ( _, index ) => colorAt( index ) );
};

const minPairwiseDistance = ( palette: string[] ): number => {
	const views = palette.map( hexToViews );
	let min = Infinity;
	for ( let i = 0; i < views.length; i++ ) {
		for ( let j = i + 1; j < views.length; j++ ) {
			min = Math.min( min, viewDistance( views[ i ], views[ j ] ) );
		}
	}
	return min;
};

describe( 'createPaletteGenerator', () => {
	it( 'returns the seeds first, in order', () => {
		const colorAt = createPaletteGenerator( [ '#ff0000', '#00ff00' ], '#ffffff' );
		expect( colorAt( 0 ) ).toBe( '#ff0000' );
		expect( colorAt( 1 ) ).toBe( '#00ff00' );
	} );

	describe.each( [
		[ '#ffffff', 15 ],
		[ '#1e1e1e', 12 ],
	] )( 'on %s', ( background, floor ) => {
		it.each( WP_ADMIN_ACCENTS )(
			'keeps a palette seeded with %s separable in every vision view up to six colors',
			accent => {
				expect( minPairwiseDistance( paletteOf( [ accent ], background ) ) ).toBeGreaterThanOrEqual(
					floor
				);
			}
		);

		it.each( WP_ADMIN_ACCENTS )(
			'gives every color generated from %s 3:1 against the background',
			accent => {
				paletteOf( [ accent ], background )
					.slice( 1 )
					.forEach( color => {
						expect( contrastRatio( color, background ) ).toBeGreaterThanOrEqual(
							MIN_BACKGROUND_CONTRAST
						);
					} );
			}
		);
	} );

	it( 'returns the same colors whatever order they are asked for in', () => {
		const inOrder = paletteOf( [ '#3858e9' ], '#ffffff', 8 );
		const colorAt = createPaletteGenerator( [ '#3858e9' ], '#ffffff' );
		expect( colorAt( 7 ) ).toBe( inOrder[ 7 ] );
		expect( colorAt( 5 ) ).toBe( inOrder[ 5 ] );
	} );

	it( 'never repeats a seed or an earlier generated color', () => {
		const palette = paletteOf( [ '#3858e9', '#e14d43', '#04a4cc' ], '#ffffff', 12 );
		expect( new Set( palette ).size ).toBe( palette.length );
	} );

	it( 'still generates when no candidate reaches 3:1 against the background', () => {
		const palette = paletteOf( [ '#3858e9' ], '#777777' );
		palette.forEach( color => expect( color ).toMatch( /^#[0-9a-f]{6}$/ ) );
		expect( new Set( palette ).size ).toBe( palette.length );
	} );

	it( 'generates from nothing when there are no seeds', () => {
		const palette = paletteOf( [], '#ffffff', 3 );
		palette.forEach( color => expect( color ).toMatch( /^#[0-9a-f]{6}$/ ) );
		expect( minPairwiseDistance( palette ) ).toBeGreaterThanOrEqual( 15 );
	} );

	it( 'keeps generating past a small non-empty legible set without throwing', () => {
		// #9b9b9b has 5 legible candidates in the grid, so asking for 10 falls back to the rest of it.
		const palette = paletteOf( [], '#9b9b9b', 10 );
		palette.forEach( color => expect( color ).toMatch( /^#[0-9a-f]{6}$/ ) );
		expect( new Set( palette ).size ).toBe( palette.length );
	} );

	it( 'never regenerates a color equal to a seed', () => {
		const [ , duplicateSeed ] = paletteOf( [ '#3858e9' ], '#ffffff', 2 );
		const generated = paletteOf( [ '#3858e9', duplicateSeed ], '#ffffff', 22 ).slice( 2 );
		expect( generated ).not.toContain( duplicateSeed );
	} );

	it( 'repeats rather than throws once the whole grid is used up', () => {
		// The candidate grid holds roughly 2,757 distinct in-gamut colors; 3000 comfortably exceeds it.
		const palette = paletteOf( [], '#ffffff', 3000 );
		palette.forEach( color => expect( color ).toMatch( /^#[0-9a-f]{6}$/ ) );
		expect( new Set( palette ).size ).toBeLessThan( palette.length );
	} );
} );

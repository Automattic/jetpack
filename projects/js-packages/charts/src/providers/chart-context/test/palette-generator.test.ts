import {
	createPaletteGenerator,
	MIN_BACKGROUND_CONTRAST,
	MIN_LABEL_CONTRAST,
	PREFERRED_SEPARATION,
} from '../private/palette-generator';
import { contrastRatio, hexToOklch, hexToViews, viewDistance } from '../private/perceptual-color';

// `--wp-admin-theme-color` for each wp-admin color scheme, as `@wordpress/base-styles` sets it.
const WP_ADMIN_THEME_COLORS = Object.entries( {
	light: '#007cba',
	modern: '#3858e9',
	blue: '#437aa8',
	coffee: '#916745',
	ectoplasm: '#646c3e',
	midnight: '#cf4339',
	ocean: '#567958',
	sunrise: '#ad631e',
} );
const PALETTE_SIZE = 6;
const LABEL_COLORS = [ '#1e1e1e', '#f0f0f0' ];

const paletteOf = (
	seeds: string[],
	background: string,
	size = PALETTE_SIZE,
	labelColors: string[] = LABEL_COLORS
): string[] => {
	const colorAt = createPaletteGenerator( seeds, background, labelColors );
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

	describe.each( [ '#ffffff', '#1e1e1e' ] )( 'on %s', background => {
		it.each( WP_ADMIN_THEME_COLORS )(
			'keeps a palette seeded with the %s scheme (%s) separable in every vision view up to six colors',
			( _scheme, seed ) => {
				expect( minPairwiseDistance( paletteOf( [ seed ], background ) ) ).toBeGreaterThanOrEqual(
					PREFERRED_SEPARATION
				);
			}
		);

		it.each( WP_ADMIN_THEME_COLORS )(
			'gives every color generated from the %s scheme (%s) 3:1 against the background',
			( _scheme, seed ) => {
				paletteOf( [ seed ], background )
					.slice( 1 )
					.forEach( color => {
						expect( contrastRatio( color, background ) ).toBeGreaterThanOrEqual(
							MIN_BACKGROUND_CONTRAST
						);
					} );
			}
		);

		it.each( WP_ADMIN_THEME_COLORS )(
			'gives every color generated from the %s scheme (%s) a label color with 4.5:1 on it',
			( _scheme, seed ) => {
				paletteOf( [ seed ], background )
					.slice( 1 )
					.forEach( color => {
						const best = Math.max( ...LABEL_COLORS.map( label => contrastRatio( color, label ) ) );
						expect( best ).toBeGreaterThanOrEqual( MIN_LABEL_CONTRAST );
					} );
			}
		);
	} );

	it( 'keeps 3:1 against the background when no fill can reach 4.5:1 with the label colors', () => {
		paletteOf( [ '#3858e9' ], '#ffffff', PALETTE_SIZE, [ '#777777' ] )
			.slice( 1 )
			.forEach( color => {
				expect( contrastRatio( color, '#ffffff' ) ).toBeGreaterThanOrEqual(
					MIN_BACKGROUND_CONTRAST
				);
			} );
	} );

	it.each( WP_ADMIN_THEME_COLORS )(
		'sets the first generated color further from the %s scheme seed (%s) than the second',
		( _scheme, seed ) => {
			const [ seedColor, first, second ] = paletteOf( [ seed ], '#ffffff', 3 ).map( hexToViews );
			expect( viewDistance( seedColor, first ) ).toBeGreaterThan(
				viewDistance( seedColor, second )
			);
		}
	);

	it.each( [ '#007cba', '#3858e9', '#437aa8' ] )(
		'places the second generated color just ahead of %s on the hue wheel',
		seed => {
			const seedHue = hexToOklch( seed ).hue;
			const walkedHue = hexToOklch( paletteOf( [ seed ], '#ffffff', 3 )[ 2 ] ).hue;
			expect( ( walkedHue - seedHue + 360 ) % 360 ).toBeLessThan( 45 );
		}
	);

	it( 'returns the same colors whatever order they are asked for in', () => {
		const inOrder = paletteOf( [ '#3858e9' ], '#ffffff', 8 );
		const colorAt = createPaletteGenerator( [ '#3858e9' ], '#ffffff', LABEL_COLORS );
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
		// #9b9b9b has exactly 5 legible candidates, so seeding one and asking for the rest of
		// the pool (plus one more, which forces the first grid fallback) exhausts it deterministically.
		const legible = paletteOf( [], '#9b9b9b', 5 );
		const seed = legible[ 0 ];
		const generated = paletteOf( [ seed ], '#9b9b9b', 6 ).slice( 1 );
		expect( generated ).not.toContain( seed );
	} );

	it( 'excludes a seed from the grid even when it is given in uppercase', () => {
		const legible = paletteOf( [], '#9b9b9b', 5 );
		const seed = legible[ 0 ];
		const generated = paletteOf( [ seed.toUpperCase() ], '#9b9b9b', 6 ).slice( 1 );
		expect( generated ).not.toContain( seed );
	} );

	it( 'repeats rather than throws once the whole grid is used up', () => {
		// The candidate grid holds roughly 2,757 distinct in-gamut colors; 3000 comfortably exceeds it.
		const palette = paletteOf( [], '#ffffff', 3000 );
		palette.forEach( color => expect( color ).toMatch( /^#[0-9a-f]{6}$/ ) );
		const placedCount = new Set( palette ).size;
		expect( placedCount ).toBeLessThan( palette.length );

		// The repeats cycle through the colors placed before the grid ran out, not always the first.
		expect( palette[ placedCount ] ).toBe( palette[ 0 ] );
		expect( palette[ placedCount + 1 ] ).toBe( palette[ 1 ] );
	} );
} );

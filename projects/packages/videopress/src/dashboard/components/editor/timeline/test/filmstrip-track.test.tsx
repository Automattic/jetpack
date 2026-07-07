import { render, screen } from '@testing-library/react';
import StudioEditorFilmstripTrack, { getFilmstripZoomMax } from '../filmstrip-track';
import type { FilmstripState } from '../../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../../types/edits';

/**
 * Build a Storyboard descriptor for tile-geometry assertions.
 *
 * The 160×80 tile against the 64px row gives round cover-crop numbers:
 * at a 100px tile box, scale = max(100/160, 64/80) = 0.8, so one drawn
 * cell is 128×64px.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete Storyboard.
 */
function makeStoryboard( overrides: Partial< Storyboard > = {} ): Storyboard {
	return {
		url: 'https://example.com/sprite.jpg',
		tile_width: 160,
		tile_height: 80,
		tiles: 5,
		columns: 3,
		interval_ms: 1000,
		...overrides,
	};
}

describe( 'StudioEditorFilmstripTrack', () => {
	it( 'renders the neutral placeholder when no filmstrip is provided', () => {
		render( <StudioEditorFilmstripTrack /> );

		const track = screen.getByTestId( 'studio-timeline-filmstrip' );
		expect( track ).toHaveClass( 'vp-studio-timeline__filmstrip-placeholder' );
		expect( track ).toHaveAttribute( 'data-mode', 'unavailable' );
	} );

	it( 'renders the placeholder while loading', () => {
		render( <StudioEditorFilmstripTrack filmstrip={ { status: 'loading' } } /> );

		const track = screen.getByTestId( 'studio-timeline-filmstrip' );
		expect( track ).toHaveClass( 'vp-studio-timeline__filmstrip-placeholder' );
		expect( track ).toHaveAttribute( 'data-mode', 'loading' );
	} );

	it( 'renders one cover-cropped <img> per extracted frame', () => {
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'frames', frames: [ 'blob:frame-0', 'blob:frame-1' ] } }
			/>
		);

		expect( screen.getByTestId( 'studio-timeline-filmstrip' ) ).toHaveAttribute(
			'data-mode',
			'frames'
		);
		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 2 );
		expect( tiles[ 0 ].tagName ).toBe( 'IMG' );
		expect( tiles[ 0 ] ).toHaveAttribute( 'src', 'blob:frame-0' );
		expect( tiles[ 1 ] ).toHaveAttribute( 'src', 'blob:frame-1' );
		// Decorative strip: empty alt, no native dragging.
		expect( tiles[ 0 ] ).toHaveAttribute( 'alt', '' );
		expect( tiles[ 0 ] ).toHaveAttribute( 'draggable', 'false' );
	} );

	it( 'renders storyboard tiles as centered pixel cover-crops of their sprite cells', () => {
		// 5 tiles over 3 columns → 2 sprite rows; 500px track → 100px boxes,
		// scale 0.8, drawn cells 128×64.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'storyboard', storyboard: makeStoryboard() } }
				trackWidth={ 500 }
			/>
		);

		expect( screen.getByTestId( 'studio-timeline-filmstrip' ) ).toHaveAttribute(
			'data-mode',
			'storyboard'
		);
		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 5 );

		// The whole sheet drawn at scale 0.8: 3×128 by 2×64 device pixels.
		expect( tiles[ 0 ] ).toHaveStyle( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '384px 128px',
			// First cell, centered in the 100px box: (100 − 128) / 2 = −14.
			backgroundPosition: '-14px 0px',
		} );
		// Tile 2: last column of the first row, shifted 2 cells left.
		expect( tiles[ 2 ] ).toHaveStyle( { backgroundPosition: '-270px 0px' } );
		// Tile 4: second column of the second row.
		expect( tiles[ 4 ] ).toHaveStyle( { backgroundPosition: '-142px -64px' } );
	} );

	it( 'renders a single-row storyboard with no vertical shift', () => {
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ {
					status: 'storyboard',
					storyboard: makeStoryboard( { tiles: 3, columns: 3 } ),
				} }
				trackWidth={ 300 }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 3 );
		expect( tiles[ 0 ] ).toHaveStyle( { backgroundSize: '384px 64px' } );
		expect( tiles[ 1 ] ).toHaveStyle( { backgroundPosition: '-142px 0px' } );
	} );

	it( 'never upscales the sprite: the cover scale clamps at 1', () => {
		// A 32×32 sprite cell in a 100px-wide box wants scale 3.125 to cover;
		// the clamp draws it at natural size, centered, instead of smearing it.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ {
					status: 'storyboard',
					storyboard: makeStoryboard( {
						tile_width: 32,
						tile_height: 32,
						tiles: 2,
						columns: 2,
					} ),
				} }
				trackWidth={ 200 }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles[ 0 ] ).toHaveStyle( {
			// Natural sheet size: 2×32 by 1×32 — not inflated to the boxes.
			backgroundSize: '64px 32px',
			// Centered: (100 − 32) / 2 = 34, (64 − 32) / 2 = 16.
			backgroundPosition: '34px 16px',
		} );
	} );

	it( 'sizes the drawn sheet from the sprite physical row count for a padded grid', () => {
		// 17 tiles in a fixed 10×10 sheet: the drawn sheet must span 10 rows,
		// not ceil(17/10)=2, or the vertical scale is wrong for every tile and
		// the blank padded cells bleed in.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ {
					status: 'storyboard',
					storyboard: makeStoryboard( { tiles: 17, columns: 10, rows: 10 } ),
				} }
				trackWidth={ 1700 }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 17 );
		// 100px boxes → scale 0.8 → 10×128 by 10×64 device pixels.
		expect( tiles[ 0 ] ).toHaveStyle( { backgroundSize: '1280px 640px' } );
		// Tile 16: column 6 of row 1.
		expect( tiles[ 16 ] ).toHaveStyle( {
			backgroundSize: '1280px 640px',
			backgroundPosition: '-782px -64px',
		} );
	} );

	it( 'paints no tile background without a measured track width', () => {
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'storyboard', storyboard: makeStoryboard() } }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 5 );
		// No geometry, no inline style at all — not a mis-sized sheet.
		expect( tiles[ 0 ] ).not.toHaveAttribute( 'style' );
	} );
} );

describe( 'getFilmstripZoomMax', () => {
	// Native-aspect display width of one 16:9 cell at the 64px row.
	const FALLBACK_CELL_WIDTH = 64 * ( 16 / 9 );

	/**
	 * Wrap a storyboard fixture in its filmstrip state.
	 *
	 * @param overrides - Storyboard fields to override.
	 * @return The storyboard filmstrip state.
	 */
	function storyboardState( overrides: Partial< Storyboard > = {} ): FilmstripState {
		return { status: 'storyboard', storyboard: makeStoryboard( overrides ) };
	}

	it( 'derives the cap from the storyboard tile count and aspect', () => {
		// 50 tiles at 160/80 = 2:1 → cell width 128px → 6400px of native-width
		// strip across a 1000px viewport.
		expect( getFilmstripZoomMax( storyboardState( { tiles: 50 } ), 10000, 1000 ) ).toBe( 6.4 );
	} );

	it( 'clamps to 1 when the strip already fits unstretched', () => {
		// 5 tiles × 128px = 640px < 1000px viewport: zooming in could only upscale.
		expect( getFilmstripZoomMax( storyboardState(), 10000, 1000 ) ).toBe( 1 );
	} );

	it( 'derives the cap from the frame count at 16:9 in frames mode', () => {
		const frames = Array.from( { length: 30 }, ( _, index ) => `blob:frame-${ index }` );
		expect( getFilmstripZoomMax( { status: 'frames', frames }, 60000, 1000 ) ).toBeCloseTo(
			( 30 * FALLBACK_CELL_WIDTH ) / 1000,
			10
		);
	} );

	it( 'falls back to one 16:9 tile per second while loading', () => {
		expect( getFilmstripZoomMax( { status: 'loading' }, 60000, 1000 ) ).toBeCloseTo(
			( 60 * FALLBACK_CELL_WIDTH ) / 1000,
			10
		);
	} );

	it( 'uses the same duration fallback for unavailable and absent strips', () => {
		const expected = ( 60 * FALLBACK_CELL_WIDTH ) / 1000;
		expect( getFilmstripZoomMax( { status: 'unavailable' }, 60000, 1000 ) ).toBeCloseTo(
			expected,
			10
		);
		expect( getFilmstripZoomMax( undefined, 60000, 1000 ) ).toBeCloseTo( expected, 10 );
	} );

	it( 'returns 1 for an unmeasured viewport or a degenerate duration', () => {
		expect( getFilmstripZoomMax( { status: 'loading' }, 60000, 0 ) ).toBe( 1 );
		expect( getFilmstripZoomMax( undefined, 0, 1000 ) ).toBe( 1 );
	} );
} );

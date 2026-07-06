import { render, screen } from '@testing-library/react';
import StudioEditorFilmstripTrack from '../filmstrip-track';
import type { Storyboard } from '../../../../types/edits';

/**
 * Build a Storyboard descriptor for tile-geometry assertions.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete Storyboard.
 */
function makeStoryboard( overrides: Partial< Storyboard > = {} ): Storyboard {
	return {
		url: 'https://example.com/sprite.jpg',
		tile_width: 160,
		tile_height: 90,
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

	it( 'renders one stretched <img> per extracted frame', () => {
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

	it( 'renders storyboard tiles with percentage sprite positioning', () => {
		// 5 tiles over 3 columns → 2 sprite rows.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'storyboard', storyboard: makeStoryboard() } }
			/>
		);

		expect( screen.getByTestId( 'studio-timeline-filmstrip' ) ).toHaveAttribute(
			'data-mode',
			'storyboard'
		);
		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 5 );

		// Every tile shows one sheet cell: the sheet spans 3×2 element sizes.
		expect( tiles[ 0 ] ).toHaveStyle( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '300% 200%',
			// First column, first row.
			backgroundPosition: '0% 0%',
		} );
		// Tile 2: last column of the first row.
		expect( tiles[ 2 ] ).toHaveStyle( { backgroundPosition: '100% 0%' } );
		// Tile 4: second column of the second row.
		expect( tiles[ 4 ] ).toHaveStyle( { backgroundPosition: '50% 100%' } );
	} );

	it( 'renders a single-row storyboard pinned to 0% vertically', () => {
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ {
					status: 'storyboard',
					storyboard: makeStoryboard( { tiles: 3, columns: 3 } ),
				} }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 3 );
		expect( tiles[ 0 ] ).toHaveStyle( { backgroundSize: '300% 100%' } );
		expect( tiles[ 1 ] ).toHaveStyle( { backgroundPosition: '50% 0%' } );
	} );

	it( 'uses the sprite physical row count for a padded grid', () => {
		// 17 tiles in a fixed 10×10 sheet: the crop must span 10 rows, not
		// ceil(17/10)=2, or every second-row tile shows a blank padded cell.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ {
					status: 'storyboard',
					storyboard: makeStoryboard( { tiles: 17, columns: 10, rows: 10 } ),
				} }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 17 );
		// 10 columns × 10 rows → the sheet spans 1000% × 1000% of one tile
		// element (the pre-fix ceil derivation would give 200% height here).
		expect( tiles[ 0 ] ).toHaveStyle( { backgroundSize: '1000% 1000%' } );
		expect( tiles[ 16 ] ).toHaveStyle( { backgroundSize: '1000% 1000%' } );
	} );
} );

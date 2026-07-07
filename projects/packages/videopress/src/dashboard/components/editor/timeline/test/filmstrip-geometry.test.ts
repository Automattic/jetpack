import {
	cellWidth,
	FILMSTRIP_ROW_HEIGHT,
	quantizeDensity,
	sampleIndices,
	sampleWidths,
	tileBackgroundStyle,
} from '../filmstrip-geometry';
import type { Storyboard } from '../../../../types/edits';

describe( 'cellWidth', () => {
	it( 'is the native-aspect width at the filmstrip row height', () => {
		// 2:1 tiles in the 64px row → 128px cells.
		expect( cellWidth( 160, 80 ) ).toBe( 128 );
		expect( cellWidth( 160, 90 ) ).toBeCloseTo( ( 64 * 16 ) / 9, 10 );
	} );

	it( 'falls back to 16:9 when the dimensions are absent or degenerate', () => {
		const fallback = FILMSTRIP_ROW_HEIGHT * ( 16 / 9 );
		expect( cellWidth() ).toBeCloseTo( fallback, 10 );
		expect( cellWidth( 0, 0 ) ).toBeCloseTo( fallback, 10 );
		expect( cellWidth( 160, 0 ) ).toBeCloseTo( fallback, 10 );
		expect( cellWidth( -160, 90 ) ).toBeCloseTo( fallback, 10 );
	} );

	it( 'scales with a custom row height', () => {
		expect( cellWidth( 160, 80, 32 ) ).toBe( 64 );
	} );
} );

describe( 'quantizeDensity', () => {
	// The design doc's 60s ladder: 16:9 tiles at 1s intervals, 1000px
	// viewport. zoomMax = 60 tiles × cellW / 1000 ≈ 6.83; densities halve
	// per step (Will's "double each step" case).
	describe( '60s video, interval_ms 1000 (doubling ladder)', () => {
		const cellW = cellWidth(); // ≈ 113.78
		const zoomMax = ( 60 * cellW ) / 1000;

		it.each( [
			// step, density (source tiles per rendered tile), rendered tiles
			[ 0, 8, 8 ],
			[ 1, 4, 15 ],
			[ 2, 2, 30 ],
			[ 3, 1, 60 ],
		] )( 'step %i → every %ith tile, %i rendered', ( step, density, rendered ) => {
			const zoom = zoomMax ** ( step / 3 );
			const pxPerMs = ( 1000 * zoom ) / 60000;
			expect( quantizeDensity( pxPerMs, 1000, cellW ) ).toBe( density );
			expect( sampleIndices( 60, density ) ).toHaveLength( rendered );
		} );
	} );

	// The design doc's corrected 10-min ladder for the real wpcom endpoint:
	// ONE adaptive sheet of 100 tiles at interval_ms 6000 — the quantizer's
	// base unit is the payload interval, not a hardcoded 1s. Densities
	// quadruple between the lower steps.
	describe( '10-min video, interval_ms 6000, 100 tiles (adaptive sheet)', () => {
		const cellW = cellWidth(); // ≈ 113.78
		const zoomMax = ( 100 * cellW ) / 1000; // ≈ 11.38 — interval-independent

		it.each( [
			// step, density, seconds per rendered tile, rendered tiles
			[ 0, 16, 96, 7 ],
			[ 1, 4, 24, 25 ],
			[ 2, 2, 12, 50 ],
			[ 3, 1, 6, 100 ],
		] )(
			'step %i → every %ith tile (%is/tile), %i rendered',
			( step, density, secondsPerTile, rendered ) => {
				const zoom = zoomMax ** ( step / 3 );
				const pxPerMs = ( 1000 * zoom ) / 600000;
				expect( quantizeDensity( pxPerMs, 6000, cellW ) ).toBe( density );
				expect( ( density * 6000 ) / 1000 ).toBe( secondsPerTile );
				expect( sampleIndices( 100, density ) ).toHaveLength( rendered );

				// The ladder's whole point: the rendered tile width stays
				// within a factor of √2 of the native cell width at every step.
				const width = density * 6000 * pxPerMs;
				expect( width ).toBeGreaterThanOrEqual( cellW / Math.SQRT2 - 1e-9 );
				expect( width ).toBeLessThanOrEqual( cellW * Math.SQRT2 + 1e-9 );
			}
		);
	} );

	it( 'floors at 1: zooms past the source density widen tiles instead of skipping', () => {
		// px per interval (200) already exceeds the cell width (128).
		expect( quantizeDensity( 0.2, 1000, 128 ) ).toBe( 1 );
	} );

	it( 'returns 1 on degenerate input rather than guessing', () => {
		expect( quantizeDensity( 0, 1000, 128 ) ).toBe( 1 );
		expect( quantizeDensity( 0.1, 0, 128 ) ).toBe( 1 );
		expect( quantizeDensity( 0.1, 1000, 0 ) ).toBe( 1 );
		expect( quantizeDensity( NaN, 1000, 128 ) ).toBe( 1 );
	} );
} );

describe( 'sampleIndices', () => {
	it( 'is start-anchored: multiples of the density from 0', () => {
		expect( sampleIndices( 10, 4 ) ).toEqual( [ 0, 4, 8 ] );
		expect( sampleIndices( 8, 8 ) ).toEqual( [ 0 ] );
		expect( sampleIndices( 3, 1 ) ).toEqual( [ 0, 1, 2 ] );
	} );

	it( 'returns empty for an empty source', () => {
		expect( sampleIndices( 0, 4 ) ).toEqual( [] );
	} );

	it( 'treats densities below 1 as 1', () => {
		expect( sampleIndices( 3, 0 ) ).toEqual( [ 0, 1, 2 ] );
	} );

	it( 'nests: the sample set at 2n is a subset of the set at n', () => {
		// Perceptual continuity when stepping the zoom: every coarser tile
		// stays in place and finer steps only interleave new ones.
		for ( const tiles of [ 60, 91, 100 ] ) {
			for ( const density of [ 1, 2, 4, 8 ] ) {
				const finer = new Set( sampleIndices( tiles, density ) );
				for ( const index of sampleIndices( tiles, density * 2 ) ) {
					expect( finer ).toContain( index );
				}
			}
		}
	} );
} );

describe( 'sampleWidths', () => {
	it( 'rounds interior boundaries to whole px and gives the last tile the residue', () => {
		// The 60s ladder at fit: 8 tiles at an ideal 133.33px over a 1000px
		// track. Interior boundaries at round(i × 133.33); the 8th tile is
		// the remainder (60 % 8 = 4 source tiles → ~67px).
		const widths = sampleWidths( 8, 8000 / 60, 1000 );
		expect( widths ).toEqual( [ 133, 134, 133, 133, 134, 133, 133, 67 ] );
	} );

	it.each( [
		[ 8, 8000 / 60, 1000 ],
		[ 7, 160, 1000 ],
		[ 25, 89.9749, 2249.4 ],
		[ 6, 160, 910 ],
	] )(
		'sums exactly to the track width (%i tiles, %f px ideal, %f track)',
		( count, ideal, track ) => {
			const widths = sampleWidths( count, ideal, track );
			expect( widths ).toHaveLength( count );
			expect( widths.reduce( ( sum, width ) => sum + width, 0 ) ).toBeCloseTo( track, 9 );
			widths.forEach( width => expect( width ).toBeGreaterThanOrEqual( 0 ) );
		}
	);

	it( 'clamps boundaries that overshoot the track instead of going negative', () => {
		// Source coverage past the duration (tiles × interval > durationMs):
		// the ideal widths overrun the track; the tail zeroes out and the sum
		// still pins to the track width.
		expect( sampleWidths( 3, 500, 1000 ) ).toEqual( [ 500, 500, 0 ] );
	} );

	it( 'keeps a fractional track width intact via the last tile', () => {
		expect( sampleWidths( 2, 100, 250.5 ) ).toEqual( [ 100, 150.5 ] );
	} );

	it( 'returns empty on degenerate input', () => {
		expect( sampleWidths( 0, 100, 1000 ) ).toEqual( [] );
		expect( sampleWidths( 5, 100, 0 ) ).toEqual( [] );
	} );
} );

describe( 'tileBackgroundStyle', () => {
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

	it( 'centers the sprite cell in the box as a pixel cover-crop', () => {
		const storyboard = makeStoryboard();
		// The whole sheet drawn at scale 0.8: 3×128 by 2×64 device pixels.
		expect( tileBackgroundStyle( storyboard, 0, 100 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '384px 128px',
			// First cell, centered in the 100px box: (100 − 128) / 2 = −14.
			backgroundPosition: '-14px 0px',
		} );
		// Tile 2: last column of the first row, shifted 2 cells left.
		expect( tileBackgroundStyle( storyboard, 2, 100 ).backgroundPosition ).toBe( '-270px 0px' );
		// Tile 4: second column of the second row.
		expect( tileBackgroundStyle( storyboard, 4, 100 ).backgroundPosition ).toBe( '-142px -64px' );
	} );

	it( 'renders a single-row sheet with no vertical shift', () => {
		const storyboard = makeStoryboard( { tiles: 3, columns: 3 } );
		expect( tileBackgroundStyle( storyboard, 1, 100 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '384px 64px',
			backgroundPosition: '-142px 0px',
		} );
	} );

	it( 'never upscales: the cover scale clamps at 1', () => {
		// A 32×32 sprite cell in a 100px-wide box wants scale 3.125 to cover;
		// the clamp draws it at natural size, centered, instead of smearing it.
		const storyboard = makeStoryboard( { tile_width: 32, tile_height: 32, tiles: 2, columns: 2 } );
		expect( tileBackgroundStyle( storyboard, 0, 100 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			// Natural sheet size: 2×32 by 1×32 — not inflated to the boxes.
			backgroundSize: '64px 32px',
			// Centered: (100 − 32) / 2 = 34, (64 − 32) / 2 = 16.
			backgroundPosition: '34px 16px',
		} );
	} );

	it( 'sizes the drawn sheet from the sprite physical row count for a padded grid', () => {
		// 17 tiles in a fixed 10×10 sheet: the drawn sheet must span 10 rows,
		// not ceil(17/10)=2, or the vertical scale is wrong for every tile
		// and the blank padded cells bleed in.
		const storyboard = makeStoryboard( { tiles: 17, columns: 10, rows: 10 } );
		// 100px boxes → scale 0.8 → 10×128 by 10×64 device pixels.
		expect( tileBackgroundStyle( storyboard, 0, 100 ).backgroundSize ).toBe( '1280px 640px' );
		// Tile 16: column 6 of row 1.
		expect( tileBackgroundStyle( storyboard, 16, 100 ).backgroundPosition ).toBe( '-782px -64px' );
	} );

	it( 'honors a custom row height', () => {
		// A 32px row halves the cover scale: 0.4 → cells 64×32.
		expect( tileBackgroundStyle( makeStoryboard(), 0, 50, 32 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '192px 64px',
			backgroundPosition: '-7px 0px',
		} );
	} );

	it( 'paints nothing on degenerate geometry', () => {
		expect( tileBackgroundStyle( makeStoryboard(), 0, 0 ) ).toEqual( {} );
		expect( tileBackgroundStyle( makeStoryboard( { tile_width: 0 } ), 0, 100 ) ).toEqual( {} );
		expect( tileBackgroundStyle( makeStoryboard( { tile_height: 0 } ), 0, 100 ) ).toEqual( {} );
	} );
} );

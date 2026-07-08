import {
	BASE_ZOOM_STEPS,
	cellWidth,
	FILMSTRIP_ROW_HEIGHT,
	frameBackgroundStyle,
	ladderMaxZoom,
	ladderStepCount,
	ladderStepForZoom,
	ladderZoomForStep,
	MIN_DENSIFIED_INTERVAL_MS,
	quantizeDensity,
	sampleIndices,
	sampleTiles,
	sampleWidths,
	subIntervalStops,
	tileBackgroundStyle,
	visibleWindowTimes,
} from '../filmstrip-geometry';
import type { Storyboard } from '../../../../types/edits';
import type { ZoomLadder } from '../filmstrip-geometry';

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

	describe( 'densified floor (minDensity < 1)', () => {
		it( 'returns fractional densities below the source density', () => {
			// px per interval double the cell width → each source interval
			// splits in two; quadruple → in four.
			expect( quantizeDensity( 0.256, 1000, 128, 0.25 ) ).toBe( 0.5 );
			expect( quantizeDensity( 0.512, 1000, 128, 0.25 ) ).toBe( 0.25 );
		} );

		it( 'floors at minDensity: zooms past the last densified stop widen tiles', () => {
			expect( quantizeDensity( 2.048, 1000, 128, 0.25 ) ).toBe( 0.25 );
		} );

		it( 'keeps the classic floor for a degenerate minDensity', () => {
			expect( quantizeDensity( 0.256, 1000, 128, 0 ) ).toBe( 1 );
			expect( quantizeDensity( 0.256, 1000, 128, 4 ) ).toBe( 1 );
			expect( quantizeDensity( 0.256, 1000, 128, NaN ) ).toBe( 1 );
		} );
	} );
} );

describe( 'subIntervalStops', () => {
	it.each( [
		// interval_ms, densified stops (halvings that stay ≥ 1000ms)
		[ 1000, 0 ], // ≤100s videos: sub-second stays deferred.
		[ 1999, 0 ],
		[ 2000, 1 ],
		[ 6000, 2 ], // 10-min adaptive sheet → 3000ms and 1500ms stops.
		[ 18000, 4 ], // 30-min adaptive sheet → 9000/4500/2250/1125ms stops.
	] )( 'interval %ims supports %i densified stops', ( intervalMs, stops ) => {
		expect( subIntervalStops( intervalMs ) ).toBe( stops );
		// The floor is the whole point: the finest effective interval the
		// stops reach must stay at or above the minimum.
		expect( intervalMs / 2 ** stops ).toBeGreaterThanOrEqual( MIN_DENSIFIED_INTERVAL_MS );
		expect( intervalMs / 2 ** ( stops + 1 ) ).toBeLessThan( MIN_DENSIFIED_INTERVAL_MS );
	} );

	it( 'returns 0 on degenerate input', () => {
		expect( subIntervalStops( 0 ) ).toBe( 0 );
		expect( subIntervalStops( -6000 ) ).toBe( 0 );
		expect( subIntervalStops( NaN ) ).toBe( 0 );
		expect( subIntervalStops( 6000, 0 ) ).toBe( 0 );
	} );

	it( 'honors a custom minimum interval', () => {
		expect( subIntervalStops( 6000, 500 ) ).toBe( 3 );
	} );
} );

describe( 'zoom ladder', () => {
	// The real 10-min shape: 100-tile adaptive sheet at interval_ms 6000,
	// 16:9 tiles, 1000px viewport → sourceZoom ≈ 11.38 and two densified
	// stops (3000ms, then 1500ms per tile).
	const tenMinute: ZoomLadder = {
		sourceZoom: ( 100 * cellWidth() ) / 1000,
		extraStops: 2,
	};
	// A 60s 1s-interval sheet gets no densified stops: the classic ladder.
	const flat: ZoomLadder = { sourceZoom: ( 60 * cellWidth() ) / 1000, extraStops: 0 };

	it( 'counts BASE_ZOOM_STEPS plus one stop per interval halving', () => {
		expect( ladderStepCount( flat ) ).toBe( BASE_ZOOM_STEPS );
		expect( ladderStepCount( tenMinute ) ).toBe( BASE_ZOOM_STEPS + 2 );
	} );

	it( 'doubles the ceiling once per densified stop', () => {
		expect( ladderMaxZoom( flat ) ).toBe( flat.sourceZoom );
		expect( ladderMaxZoom( tenMinute ) ).toBeCloseTo( tenMinute.sourceZoom * 4, 10 );
	} );

	it( 'spaces the base tier geometrically and the densified tier by doubling', () => {
		// Base tier: zoom(k) = sourceZoom^(k/3), the pre-densification ladder.
		for ( let step = 0; step <= BASE_ZOOM_STEPS; step++ ) {
			expect( ladderZoomForStep( step, tenMinute ) ).toBeCloseTo(
				tenMinute.sourceZoom ** ( step / BASE_ZOOM_STEPS ),
				10
			);
		}
		// Densified tier: each stop doubles — i.e. halves the effective
		// interval (6000 → 3000 → 1500ms per tile).
		expect( ladderZoomForStep( 4, tenMinute ) ).toBeCloseTo( tenMinute.sourceZoom * 2, 10 );
		expect( ladderZoomForStep( 5, tenMinute ) ).toBeCloseTo( tenMinute.sourceZoom * 4, 10 );
	} );

	it( 'clamps out-of-range steps to the ladder ends', () => {
		expect( ladderZoomForStep( -2, tenMinute ) ).toBe( 1 );
		expect( ladderZoomForStep( 99, tenMinute ) ).toBe( ladderMaxZoom( tenMinute ) );
	} );

	it( 'round-trips every stop through ladderStepForZoom', () => {
		for ( const ladder of [ flat, tenMinute ] ) {
			for ( let step = 0; step <= ladderStepCount( ladder ); step++ ) {
				expect( ladderStepForZoom( ladderZoomForStep( step, ladder ), ladder ) ).toBe( step );
			}
		}
	} );

	it( 'maps in-between and out-of-range zooms to the nearest stop', () => {
		expect( ladderStepForZoom( 1, tenMinute ) ).toBe( 0 );
		expect( ladderStepForZoom( 0.5, tenMinute ) ).toBe( 0 );
		expect( ladderStepForZoom( 1e9, tenMinute ) ).toBe( ladderStepCount( tenMinute ) );
		// Between the source stop (≈11.38) and the first densified stop
		// (≈22.76), the log-nearest boundary is ≈16.1.
		expect( ladderStepForZoom( 15, tenMinute ) ).toBe( BASE_ZOOM_STEPS );
		expect( ladderStepForZoom( 17, tenMinute ) ).toBe( BASE_ZOOM_STEPS + 1 );
	} );

	it( 'degrades to a single stop when the strip already fits', () => {
		const fits: ZoomLadder = { sourceZoom: 0.8, extraStops: 0 };
		expect( ladderMaxZoom( fits ) ).toBe( 1 );
		expect( ladderZoomForStep( 3, fits ) ).toBe( 1 );
		expect( ladderStepForZoom( 1, fits ) ).toBe( 0 );
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

describe( 'sampleTiles', () => {
	it( 'matches sampleIndices at integer densities, with on-grid times', () => {
		expect( sampleTiles( 10, 6000, 4 ) ).toEqual( [
			{ timeMs: 0, spriteIndex: 0, parentIndex: 0 },
			{ timeMs: 24000, spriteIndex: 4, parentIndex: 4 },
			{ timeMs: 48000, spriteIndex: 8, parentIndex: 8 },
		] );
	} );

	it( 'splits each source interval at density 1/2: on-grid, off-grid, alternating', () => {
		const tiles = sampleTiles( 3, 6000, 0.5 );
		expect( tiles ).toEqual( [
			{ timeMs: 0, spriteIndex: 0, parentIndex: 0 },
			{ timeMs: 3000, spriteIndex: null, parentIndex: 0 },
			{ timeMs: 6000, spriteIndex: 1, parentIndex: 1 },
			{ timeMs: 9000, spriteIndex: null, parentIndex: 1 },
			{ timeMs: 12000, spriteIndex: 2, parentIndex: 2 },
			{ timeMs: 15000, spriteIndex: null, parentIndex: 2 },
		] );
	} );

	it( 'names the dyadic parent (the containing sprite tile) at every depth', () => {
		// Density 1/4: three extracted tiles per interval, all parented by the
		// sprite tile whose span contains them — the placeholder rule.
		const tiles = sampleTiles( 2, 6000, 0.25 );
		expect( tiles.map( tile => tile.parentIndex ) ).toEqual( [ 0, 0, 0, 0, 1, 1, 1, 1 ] );
		expect( tiles.map( tile => tile.spriteIndex ) ).toEqual( [
			0,
			null,
			null,
			null,
			1,
			null,
			null,
			null,
		] );
		expect( tiles.map( tile => tile.timeMs ) ).toEqual( [
			0, 1500, 3000, 4500, 6000, 7500, 9000, 10500,
		] );
	} );

	it( 'nests times dyadically: every coarser time reappears at the finer density', () => {
		// Frame-cache keys and React keys ride on this: stepping the zoom must
		// reuse the extracted frames grabbed at the coarser stop.
		const coarse = sampleTiles( 10, 6000, 0.5 ).map( tile => tile.timeMs );
		const fine = new Set( sampleTiles( 10, 6000, 0.25 ).map( tile => tile.timeMs ) );
		for ( const timeMs of coarse ) {
			expect( fine ).toContain( timeMs );
		}
	} );

	it( 'rounds a non-integer split to whole-ms times without changing identity', () => {
		// interval 4500ms at density 1/4 → 1125ms steps (the 30-min sheet's
		// deepest stop lands on fractions like this after two halvings).
		const tiles = sampleTiles( 1, 4500, 0.25 );
		expect( tiles.map( tile => tile.timeMs ) ).toEqual( [ 0, 1125, 2250, 3375 ] );
	} );

	it( 'returns empty for an empty source and treats degenerate densities as 1', () => {
		expect( sampleTiles( 0, 6000, 0.5 ) ).toEqual( [] );
		expect( sampleTiles( 3, 6000, 0 ) ).toHaveLength( 3 );
		expect( sampleTiles( 3, 6000, NaN ) ).toHaveLength( 3 );
	} );
} );

describe( 'visibleWindowTimes', () => {
	// A densified 10-min strip: off-grid times every 6000ms starting at 3000
	// (density 1/2 on a 6000ms sheet), 0.1 px/ms scale.
	const offGrid = Array.from( { length: 10 }, ( _, index ) => 3000 + index * 6000 );

	it( 'keeps the times whose tiles intersect scrollLeft ± one viewport', () => {
		// Viewport 600px at scrollLeft 1200: visible [1200px, 1800px], padded
		// one viewport each side → [600px, 2400px] → [6000ms, 24000ms]. Tiles
		// span 3000ms, so 3000 (ends exactly at 6000, exclusive) is out;
		// 9000–21000 are in; 27000 starts past the window.
		expect( visibleWindowTimes( offGrid, 3000, 1200, 600, 0.1 ) ).toEqual( [ 9000, 15000, 21000 ] );
	} );

	it( 'includes partially visible tiles on both edges', () => {
		// Window [6000ms, 24000ms]: a tile starting just before the start but
		// spanning into it stays, one starting exactly at the end is out.
		expect( visibleWindowTimes( [ 5999, 23999, 24000 ], 3000, 1200, 600, 0.1 ) ).toEqual( [
			5999, 23999,
		] );
	} );

	it( 'pads a leftmost window only to the right', () => {
		// scrollLeft 0 → window [-600px, 1200px] → up to 12000ms.
		expect( visibleWindowTimes( offGrid, 3000, 0, 600, 0.1 ) ).toEqual( [ 3000, 9000 ] );
	} );

	it( 'returns empty on degenerate geometry rather than requesting everything', () => {
		expect( visibleWindowTimes( offGrid, 3000, 0, 0, 0.1 ) ).toEqual( [] );
		expect( visibleWindowTimes( offGrid, 3000, 0, 600, 0 ) ).toEqual( [] );
		expect( visibleWindowTimes( offGrid, 0, 0, 600, 0.1 ) ).toEqual( [] );
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
		// the clamp draws it at natural size instead of smearing it.
		const storyboard = makeStoryboard( { tile_width: 32, tile_height: 32, tiles: 2, columns: 2 } );
		expect( tileBackgroundStyle( storyboard, 0, 100 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			// Natural sheet size: 2×32 by 1×32 — not inflated to the boxes.
			backgroundSize: '64px 32px',
			// The box outgrew the drawn cell, so the cell anchors flush with
			// the tile start; vertically it stays centered: (64 − 32) / 2 = 16.
			backgroundPosition: '0px 16px',
		} );
	} );

	it( 'anchors the cell flush with the tile start when the box outgrows the drawn cell', () => {
		// The wheel-zoom sliver: a 16:9 sprite cell (160×90) in a 161px box —
		// reachable because sampleWidths rounds boundaries, so rendered widths
		// can hit cellW·√2 ≈ 160.9 rounded up to 161. The cover scale clamps
		// at 1 (never upscale), leaving the drawn cell 1px narrower than the
		// box. Centering would shift the sheet right by a rounded 1px: an
		// unpainted stripe on the first column and the previous cell's
		// trailing pixel on every other. The positioning clamp anchors the
		// cell at the tile start instead.
		const storyboard = makeStoryboard( { tile_width: 160, tile_height: 90 } );
		// Column 0: no positive x offset — the cell starts exactly at the box.
		expect( tileBackgroundStyle( storyboard, 0, 161 ) ).toEqual( {
			backgroundImage: 'url("https://example.com/sprite.jpg")',
			backgroundSize: '480px 180px',
			backgroundPosition: '0px -13px',
		} );
		// Column 1: an exact drawn-cell multiple — not the −159px a centered
		// (rounded) position would produce, which paints cell 0's last pixel
		// column at this tile's leading edge.
		expect( tileBackgroundStyle( storyboard, 1, 161 ).backgroundPosition ).toBe( '-160px -13px' );
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

describe( 'frameBackgroundStyle', () => {
	it( 'centers the extracted frame in the box as a pixel cover-crop', () => {
		// A 160×80 frame in a 128px box: scale = max(128/160, 64/80) = 0.8, so
		// the frame is drawn 128×64 and fills the box exactly (no offset).
		expect( frameBackgroundStyle( 'blob:frame', 160, 80, 128 ) ).toEqual( {
			backgroundImage: 'url("blob:frame")',
			backgroundSize: '128px 64px',
			backgroundPosition: '0px 0px',
		} );
	} );

	it( 'centers a narrower box as a crop, not a squeeze', () => {
		// A 160×90 frame in a 100px box: scale = max(100/160, 64/90) = 0.711,
		// drawn 114×64; horizontally centered: (100 − 114) / 2 = −7.
		expect( frameBackgroundStyle( 'blob:frame', 160, 90, 100 ) ).toEqual( {
			backgroundImage: 'url("blob:frame")',
			backgroundSize: '114px 64px',
			backgroundPosition: '-7px 0px',
		} );
	} );

	it( 'never upscales: the cover scale clamps at 1', () => {
		// A box wider AND taller than the native frame (160×90) wants scale
		// > 1 to cover; the clamp draws it at native size and anchors it flush
		// with the tile start (a single frame has no adjacent cell to bleed).
		expect( frameBackgroundStyle( 'blob:frame', 160, 90, 200, 100 ) ).toEqual( {
			backgroundImage: 'url("blob:frame")',
			backgroundSize: '160px 90px',
			// Box (200px) outgrows the drawn frame (160px): flush-left, not the
			// −20px a centered position would give. Vertically centered:
			// (100 − 90) / 2 = 5.
			backgroundPosition: '0px 5px',
		} );
	} );

	it( 'paints nothing on degenerate geometry', () => {
		expect( frameBackgroundStyle( 'blob:frame', 160, 90, 0 ) ).toEqual( {} );
		expect( frameBackgroundStyle( 'blob:frame', 0, 90, 100 ) ).toEqual( {} );
		expect( frameBackgroundStyle( 'blob:frame', 160, 0, 100 ) ).toEqual( {} );
	} );
} );

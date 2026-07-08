import { act, render, screen } from '@testing-library/react';
import { cellWidth } from '../filmstrip-geometry';
import StudioEditorFilmstripTrack, {
	getFilmstripZoomLadder,
	getFilmstripZoomMax,
	SCROLL_SYNC_DELAY_MS,
} from '../filmstrip-track';
import type {
	FilmstripState,
	FrameExtractionPool,
	FrameSlot,
} from '../../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../../types/edits';

/**
 * Build a Storyboard descriptor for tile-geometry assertions.
 *
 * The 160×80 tile against the 64px row gives round cover-crop numbers:
 * at a 100px tile box, scale = max(100/160, 64/80) = 0.8, so one drawn
 * cell is 128×64px. The 128px native cell width also means a track sized
 * at 100px per interval quantizes to density 1 (ratio 1.28 → round 0), so
 * the fixtures below render every tile unless a test says otherwise.
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

/**
 * Read the rendered tiles' widths in px.
 *
 * @return One parsed width per tile, in document order.
 */
function tileWidths(): number[] {
	return screen
		.getAllByTestId( 'studio-timeline-filmstrip-tile' )
		.map( tile => parseFloat( tile.style.width ) );
}

type FakePool = {
	/** The pool the track consumes. */
	pool: FrameExtractionPool;
	/** Every requestFrames batch, in call order. */
	requests: number[][];
	/** Resolve a time to a URL and notify subscribers (wrap in act). */
	land: ( ms: number, url: string ) => void;
};

/**
 * Build a scriptable in-memory FrameExtractionPool: records every request
 * batch, serves 'pending' until a test lands a frame, then 'ready'.
 *
 * @return The fake pool and its scripting handles.
 */
function makeFakePool(): FakePool {
	const requests: number[][] = [];
	const ready = new Map< number, string >();
	const listeners = new Set< () => void >();
	const slotOf = ( ms: number ): FrameSlot => {
		const url = ready.get( ms );
		return url === undefined ? { status: 'pending' } : { status: 'ready', url };
	};
	const peekFrames = ( timesMs: number[] ) => new Map( timesMs.map( ms => [ ms, slotOf( ms ) ] ) );
	return {
		pool: {
			requestFrames: jest.fn( ( timesMs: number[] ) => {
				requests.push( [ ...timesMs ] );
				return peekFrames( timesMs );
			} ),
			peekFrames,
			cancelFrames: jest.fn(),
			takeFrames: () => null,
			subscribe: listener => {
				listeners.add( listener );
				return () => listeners.delete( listener );
			},
			destroy: () => {},
		},
		requests,
		land: ( ms, url ) => {
			ready.set( ms, url );
			[ ...listeners ].forEach( listener => listener() );
		},
	};
}

/**
 * Build a detached scroller element with a scriptable clientWidth (jsdom
 * reports zero layout); scrollLeft is natively settable.
 *
 * @param clientWidth - The visible width to report.
 * @return The scroller element.
 */
function makeScroller( clientWidth: number ): HTMLDivElement {
	const scroller = document.createElement( 'div' );
	Object.defineProperty( scroller, 'clientWidth', { configurable: true, value: clientWidth } );
	return scroller;
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
		// 5 tiles over 3 columns → 2 sprite rows; 500px track over 5s →
		// density 1, 100px boxes, scale 0.8, drawn cells 128×64.
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'storyboard', storyboard: makeStoryboard() } }
				trackWidth={ 500 }
				durationMs={ 5000 }
			/>
		);

		expect( screen.getByTestId( 'studio-timeline-filmstrip' ) ).toHaveAttribute(
			'data-mode',
			'storyboard'
		);
		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 5 );

		// The whole sheet drawn at scale 0.8: 3×128 by 2×64 device pixels,
		// in an explicit-width box.
		expect( tiles[ 0 ] ).toHaveStyle( {
			width: '100px',
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

	it( 'never upscales the sprite: the cover scale clamps at 1', () => {
		// A 32×32 sprite cell in a 100px-wide box wants scale 3.125 to cover;
		// the clamp draws it at natural size instead of smearing it.
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
				durationMs={ 2000 }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles[ 0 ] ).toHaveStyle( {
			// Natural sheet size: 2×32 by 1×32 — not inflated to the boxes.
			backgroundSize: '64px 32px',
			// Flush-left horizontally (no adjacent-cell bleed at the leading
			// edge); centered vertically: (64 − 32) / 2 = 16.
			backgroundPosition: '0px 16px',
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
				durationMs={ 17000 }
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

	it( 'paints no tile geometry without a measured track width', () => {
		render(
			<StudioEditorFilmstripTrack
				filmstrip={ { status: 'storyboard', storyboard: makeStoryboard() } }
				durationMs={ 5000 }
			/>
		);

		const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
		expect( tiles ).toHaveLength( 5 );
		// No geometry, no inline style at all — not a mis-sized sheet.
		expect( tiles[ 0 ] ).not.toHaveAttribute( 'style' );
	} );

	it.each( [ 0, -1000 ] )(
		'splits the track equally when the storyboard interval is degenerate (%ims)',
		intervalMs => {
			// The API validation rejects interval_ms ≤ 0, but internal callers
			// are guarded too: a degenerate interval alongside a measured scale
			// would make the ideal tile width 0 (or negative) and collapse the
			// widths to [0, …, 0, trackWidth]. The layout falls back to an
			// equal split instead. (The strict console setup also asserts the
			// collapsed all-zero times don't produce duplicate React keys.)
			render(
				<StudioEditorFilmstripTrack
					filmstrip={ {
						status: 'storyboard',
						storyboard: makeStoryboard( { interval_ms: intervalMs } ),
					} }
					trackWidth={ 500 }
					durationMs={ 5000 }
				/>
			);

			expect( tileWidths() ).toEqual( [ 100, 100, 100, 100, 100 ] );
		}
	);

	describe( 'quantized sampling', () => {
		it( 'samples every 8th sprite tile at fit for a 60s one-second storyboard', () => {
			// The design ladder's 60s fit row: cell width ≈128px vs 16.7px per
			// interval → density 8. Start-anchored: sprite indices 0, 8, … 56.
			render(
				<StudioEditorFilmstripTrack
					filmstrip={ {
						status: 'storyboard',
						storyboard: makeStoryboard( { tiles: 60, columns: 10, rows: 6 } ),
					} }
					trackWidth={ 1000 }
					durationMs={ 60000 }
				/>
			);

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles.map( tile => tile.getAttribute( 'data-index' ) ) ).toEqual( [
				'0',
				'8',
				'16',
				'24',
				'32',
				'40',
				'48',
				'56',
			] );
			// Whole-px interior boundaries; the last tile is the 60 % 8 = 4
			// leftover intervals (67px), and the sum is exactly the track.
			const widths = tileWidths();
			expect( widths ).toEqual( [ 133, 134, 133, 133, 134, 133, 133, 67 ] );
			expect( widths.reduce( ( sum, width ) => sum + width, 0 ) ).toBe( 1000 );
		} );

		it( 'pins the width sum to the track at every ladder step (adaptive 10-min sheet)', () => {
			// The real wpcom shape for a 10-min video: one 100-tile sheet at
			// interval_ms 6000. The quantizer's base unit is that payload
			// interval — density runs 16/4/2/1 down the ladder, never 1s-based.
			const storyboard = makeStoryboard( {
				tiles: 100,
				columns: 10,
				rows: 10,
				tile_width: 160,
				tile_height: 90,
				interval_ms: 6000,
			} );
			const zoomMax = ( 100 * cellWidth( 160, 90 ) ) / 1000; // ≈ 11.38
			const expectedCounts = [ 7, 25, 50, 100 ];

			for ( let step = 0; step <= 3; step++ ) {
				const trackWidth = 1000 * zoomMax ** ( step / 3 );
				const view = render(
					<StudioEditorFilmstripTrack
						filmstrip={ { status: 'storyboard', storyboard } }
						trackWidth={ trackWidth }
						durationMs={ 600000 }
					/>
				);

				const widths = tileWidths();
				expect( widths ).toHaveLength( expectedCounts[ step ] );
				expect( widths.reduce( ( sum, width ) => sum + width, 0 ) ).toBeCloseTo( trackWidth, 6 );
				widths.forEach( width => expect( width ).toBeGreaterThanOrEqual( 0 ) );

				view.unmount();
			}
		} );

		it( 'applies the quantizer to extracted frames via durationMs / frames.length', () => {
			// 30 frames over 60s → base interval 2000ms, 33.3px per frame at
			// this scale → density 4: every 4th frame, at explicit widths.
			const frames = Array.from( { length: 30 }, ( _, index ) => `blob:frame-${ index }` );
			render(
				<StudioEditorFilmstripTrack
					filmstrip={ { status: 'frames', frames } }
					trackWidth={ 1000 }
					durationMs={ 60000 }
				/>
			);

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles.map( tile => tile.getAttribute( 'src' ) ) ).toEqual( [
				'blob:frame-0',
				'blob:frame-4',
				'blob:frame-8',
				'blob:frame-12',
				'blob:frame-16',
				'blob:frame-20',
				'blob:frame-24',
				'blob:frame-28',
			] );
			const widths = tileWidths();
			expect( widths ).toEqual( [ 133, 134, 133, 133, 134, 133, 133, 67 ] );
			expect( widths.reduce( ( sum, width ) => sum + width, 0 ) ).toBe( 1000 );
		} );

		it( 'renders every tile once the scale reaches the source density', () => {
			// 128px per interval ≥ the 128px cell width → density 1.
			render(
				<StudioEditorFilmstripTrack
					filmstrip={ {
						status: 'storyboard',
						storyboard: makeStoryboard( { tiles: 60, columns: 10, rows: 6 } ),
					} }
					trackWidth={ 7680 }
					durationMs={ 60000 }
				/>
			);

			const widths = tileWidths();
			expect( widths ).toHaveLength( 60 );
			expect( widths ).toEqual( Array( 60 ).fill( 128 ) );
		} );
	} );

	describe( 'densified stops (below the sprite floor)', () => {
		// A long-video adaptive sheet in miniature: 10 tiles at interval_ms
		// 6000 over 60s, one 10×1 sheet, 128px cells. Two densified stops
		// (3000ms, 1500ms). At trackWidth 2560 (double the sprite floor's
		// 1280) the quantizer picks density 1/2: 20 tiles à 128px, on-grid
		// and off-grid alternating; off-grid times 3000, 9000, …, 57000.
		const storyboard = makeStoryboard( { tiles: 10, columns: 10, rows: 1, interval_ms: 6000 } );

		/**
		 * Render the densified fixture.
		 *
		 * @param pool     - The extraction pool, if any.
		 * @param scroller - The scroller element, if any.
		 * @return The render result.
		 */
		function renderDensified( pool?: FrameExtractionPool, scroller?: HTMLElement ) {
			return render(
				<StudioEditorFilmstripTrack
					filmstrip={ { status: 'storyboard', storyboard } }
					trackWidth={ 2560 }
					durationMs={ 60000 }
					extractionPool={ pool }
					scrollerEl={ scroller }
				/>
			);
		}

		it( 'interleaves sprite-aligned tiles with placeholders, widths still pinned to the track', () => {
			renderDensified();

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles ).toHaveLength( 20 );
			// Even positions are on the sprite grid (dyadic subset property),
			// odd ones await extraction.
			expect( tiles[ 0 ] ).toHaveAttribute( 'data-index', '0' );
			expect( tiles[ 1 ] ).toHaveAttribute( 'data-time', '3000' );
			expect( tiles[ 2 ] ).toHaveAttribute( 'data-index', '1' );
			expect( tiles[ 3 ] ).toHaveAttribute( 'data-time', '9000' );
			// One-scale invariant: the 20 widths sum exactly to the track.
			const widths = tileWidths();
			expect( widths ).toEqual( Array( 20 ).fill( 128 ) );
			expect( widths.reduce( ( sum, width ) => sum + width, 0 ) ).toBe( 2560 );
		} );

		it( 'renders the dyadic parent sprite tile as the placeholder — never blank', () => {
			renderDensified();

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			// Tile at 3000ms sits inside sprite tile 0's span; at 9000ms,
			// tile 1's. Same cover-crop math as the real tiles: scale 0.8 →
			// 128×64 cells across the 10×1 sheet.
			expect( tiles[ 1 ] ).toHaveAttribute( 'data-placeholder-index', '0' );
			expect( tiles[ 1 ] ).toHaveStyle( {
				backgroundImage: 'url("https://example.com/sprite.jpg")',
				backgroundSize: '1280px 64px',
				backgroundPosition: '0px 0px',
			} );
			expect( tiles[ 3 ] ).toHaveAttribute( 'data-placeholder-index', '1' );
			expect( tiles[ 3 ] ).toHaveStyle( { backgroundPosition: '-128px 0px' } );
		} );

		it( 'requests only visible-window off-grid times — sprite-aligned times never hit the pool', () => {
			const fake = makeFakePool();
			// 1000px viewport at scrollLeft 0: window [-1000px, 2000px] →
			// times below 46875ms; 51000 and 57000 stay unrequested.
			renderDensified( fake.pool, makeScroller( 1000 ) );

			expect( fake.requests ).toEqual( [
				[ 3000, 9000, 15000, 21000, 27000, 33000, 39000, 45000 ],
			] );
			// Nothing on the sprite grid is ever extracted.
			for ( const batch of fake.requests ) {
				for ( const ms of batch ) {
					expect( ms % 6000 ).not.toBe( 0 );
				}
			}
		} );

		it( 'requests nothing without a scroller to derive the window from', () => {
			const fake = makeFakePool();
			renderDensified( fake.pool );

			expect( fake.requests ).toEqual( [] );
			// The tiles still render — as placeholders.
			expect( screen.getAllByTestId( 'studio-timeline-filmstrip-tile' ) ).toHaveLength( 20 );
		} );

		it( 'swaps a placeholder for the extracted frame when it lands', () => {
			const fake = makeFakePool();
			renderDensified( fake.pool, makeScroller( 1000 ) );

			act( () => fake.land( 3000, 'blob:densified-3000' ) );

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles[ 1 ].tagName ).toBe( 'IMG' );
			expect( tiles[ 1 ] ).toHaveAttribute( 'src', 'blob:densified-3000' );
			expect( tiles[ 1 ] ).toHaveAttribute( 'data-time', '3000' );
			expect( tiles[ 1 ] ).toHaveAttribute( 'alt', '' );
			expect( tiles[ 1 ] ).toHaveStyle( { width: '128px' } );
			// The neighbors still wait on their own frames.
			expect( tiles[ 3 ].tagName ).toBe( 'DIV' );
		} );

		it( 'renders cached frames immediately on mount', () => {
			const fake = makeFakePool();
			fake.land( 9000, 'blob:cached-9000' );

			renderDensified( fake.pool, makeScroller( 1000 ) );

			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles[ 3 ].tagName ).toBe( 'IMG' );
			expect( tiles[ 3 ] ).toHaveAttribute( 'src', 'blob:cached-9000' );
		} );

		it( 're-derives and re-requests the window on (throttled) scroll', () => {
			jest.useFakeTimers();
			try {
				const fake = makeFakePool();
				const scroller = makeScroller( 1000 );
				renderDensified( fake.pool, scroller );
				expect( fake.requests ).toHaveLength( 1 );

				// Scroll to the far end: [560px, 3560px] → 15000ms onward.
				scroller.scrollLeft = 1560;
				scroller.dispatchEvent( new Event( 'scroll' ) );
				// Throttled: nothing until the trailing edge fires.
				expect( fake.requests ).toHaveLength( 1 );
				act( () => {
					jest.advanceTimersByTime( SCROLL_SYNC_DELAY_MS );
				} );

				expect( fake.requests ).toHaveLength( 2 );
				expect( fake.requests[ 1 ] ).toEqual( [
					15000, 21000, 27000, 33000, 39000, 45000, 51000, 57000,
				] );
			} finally {
				jest.useRealTimers();
			}
		} );

		it( 'cancels its queued times when the layout leaves the densified stop', () => {
			const fake = makeFakePool();
			const scroller = makeScroller( 1000 );
			const view = renderDensified( fake.pool, scroller );

			// Back to the sprite floor: density 1, no off-grid tiles.
			view.rerender(
				<StudioEditorFilmstripTrack
					filmstrip={ { status: 'storyboard', storyboard } }
					trackWidth={ 1280 }
					durationMs={ 60000 }
					extractionPool={ fake.pool }
					scrollerEl={ scroller }
				/>
			);

			expect( fake.pool.cancelFrames ).toHaveBeenCalledWith( [
				3000, 9000, 15000, 21000, 27000, 33000, 39000, 45000, 51000, 57000,
			] );
			expect( screen.getAllByTestId( 'studio-timeline-filmstrip-tile' ) ).toHaveLength( 10 );
		} );
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

	it( 'is interval-independent: only the tile count and aspect matter', () => {
		// The wpcom adaptive sheet serves the same 100 tiles whether they
		// span 1s or 6s each; the cap (the zoom where tiles hit native
		// width) must not change with interval_ms.
		const expected = ( 100 * 128 ) / 1000;
		expect(
			getFilmstripZoomMax( storyboardState( { tiles: 100, interval_ms: 1000 } ), 100000, 1000 )
		).toBe( expected );
		expect(
			getFilmstripZoomMax( storyboardState( { tiles: 100, interval_ms: 6000 } ), 600000, 1000 )
		).toBe( expected );
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

	describe( 'getFilmstripZoomLadder', () => {
		it( 'anchors at the cap and adds one densified stop per interval halving', () => {
			// The 10-min adaptive sheet: 100 tiles at 6000ms → the interval can
			// halve twice (3000, 1500ms) before crossing the 1000ms floor.
			expect(
				getFilmstripZoomLadder( storyboardState( { tiles: 100, interval_ms: 6000 } ), 600000, 1000 )
			).toEqual( { sourceZoom: ( 100 * 128 ) / 1000, extraStops: 2 } );
		} );

		it( 'offers no densified stops for a one-second sheet (sub-second stays deferred)', () => {
			expect(
				getFilmstripZoomLadder( storyboardState( { tiles: 60, interval_ms: 1000 } ), 60000, 1000 )
			).toEqual( { sourceZoom: ( 60 * 128 ) / 1000, extraStops: 0 } );
		} );

		it( 'never densifies frames mode or unresolved strips', () => {
			const frames = Array.from( { length: 30 }, ( _, index ) => `blob:frame-${ index }` );
			expect( getFilmstripZoomLadder( { status: 'frames', frames }, 60000, 1000 ).extraStops ).toBe(
				0
			);
			expect( getFilmstripZoomLadder( { status: 'loading' }, 600000, 1000 ).extraStops ).toBe( 0 );
			expect( getFilmstripZoomLadder( undefined, 600000, 1000 ).extraStops ).toBe( 0 );
		} );
	} );
} );

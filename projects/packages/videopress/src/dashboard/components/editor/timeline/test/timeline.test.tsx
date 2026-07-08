/* eslint-disable testing-library/prefer-user-event -- Drag gestures need raw pointer events carrying clientX/pointerId (userEvent has no pointer-capture drag primitive), the shortcuts under test listen for raw keydowns on document, and range inputs only take fireEvent.change. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEditSession, editSessionReducer } from '../../state/edit-session';
import StudioEditorTimeline from '../timeline';
import type { FilmstripState } from '../../../../hooks/use-filmstrip';
import type { EditSession } from '../../state/edit-session';
import type { StudioEditorTimelineProps } from '../timeline';

// jsdom reports zero layout, so inject the viewport width: with the 10s
// sessions below at the default 1000px, zoom 1 gives pxPerMs 0.1
// (1px = 10ms). Mutable so resize tests can re-render at a new width.
let mockViewportWidth = 1000;
jest.mock( '../use-element-width', () => ( {
	useElementWidth: () => ( { ref: () => {}, width: mockViewportWidth } ),
} ) );

// jsdom (27) ships PointerEvent but not the pointer-capture element APIs the
// drag hook calls; stub them so pointerdown handlers run.
beforeAll( () => {
	Object.assign( Element.prototype, {
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
		hasPointerCapture: () => false,
	} );
} );

beforeEach( () => {
	mockViewportWidth = 1000;
} );

/**
 * A 10s session trimmed to 2000–8000ms.
 *
 * @return The session.
 */
function trimmedSession(): EditSession {
	let session = createEditSession( 10000 );
	session = editSessionReducer( session, { type: 'SET_TRIM_START', ms: 2000 } );
	session = editSessionReducer( session, { type: 'SET_TRIM_END', ms: 8000 } );
	return session;
}

/**
 * A 10s session with one selected cut from 4000 to 6000ms.
 *
 * @return The session.
 */
function sessionWithCut(): EditSession {
	return editSessionReducer( createEditSession( 10000 ), {
		type: 'ADD_CUT',
		atMs: 5000,
		halfSpanMs: 1000,
		id: 'cut-a',
	} );
}

/**
 * A storyboard filmstrip whose 160×80 tiles give a round zoom cap: each
 * cell renders 128px wide at the 64px row, so the cap is
 * `tiles × 128 / viewport`.
 *
 * @param tiles - Total sprite tile count.
 * @return The storyboard filmstrip state.
 */
function storyboardFilmstrip( tiles: number ): FilmstripState {
	return {
		status: 'storyboard',
		storyboard: {
			url: 'https://example.com/sprite.jpg',
			tile_width: 160,
			tile_height: 80,
			tiles,
			columns: 10,
			rows: Math.max( 1, Math.ceil( tiles / 10 ) ),
			interval_ms: 1000,
		},
	};
}

/**
 * The reported canary fixture: a real 91s video with the wpcom storyboard
 * endpoint's 10×10 sheet — 91 one-second 160×90 tiles (cell width ≈113.8px,
 * zoom cap ≈11.38 at the 910px viewport the tests pair it with).
 *
 * @return The storyboard filmstrip state.
 */
function storyboard91s(): FilmstripState {
	return {
		status: 'storyboard',
		storyboard: {
			url: 'https://example.com/sprite.jpg',
			tile_width: 160,
			tile_height: 90,
			tiles: 91,
			columns: 10,
			rows: 10,
			interval_ms: 1000,
		},
	};
}

/**
 * Render the timeline with spy collaborators.
 *
 * @param overrides - Prop overrides for this test.
 * @return The spies and a same-props rerender helper.
 */
function renderTimeline( overrides: Partial< StudioEditorTimelineProps > = {} ) {
	const dispatch = jest.fn();
	const onSeek = jest.fn();
	const onTogglePlay = jest.fn();
	const props: StudioEditorTimelineProps = {
		session: createEditSession( 10000 ),
		dispatch,
		currentMs: 0,
		onSeek,
		onTogglePlay,
		playing: false,
		...overrides,
	};
	const view = render( <StudioEditorTimeline { ...props } /> );
	return {
		dispatch,
		onSeek,
		onTogglePlay,
		rerender: () => view.rerender( <StudioEditorTimeline { ...props } /> ),
	};
}

describe( 'StudioEditorTimeline', () => {
	it( 'stacks the ruler and filmstrip tracks in order under the overlay and playhead', () => {
		renderTimeline();
		// getAllByTestId returns document order, so this asserts the stack order.
		const trackIds = screen
			.getAllByTestId( /^studio-timeline-track-/ )
			.map( track => track.getAttribute( 'data-testid' ) );
		expect( trackIds ).toEqual( [
			'studio-timeline-track-ruler',
			'studio-timeline-track-filmstrip',
		] );
		expect( screen.getByTestId( 'studio-timeline-overlay' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'studio-timeline-playhead' ) ).toBeInTheDocument();
	} );

	it( 'sizes the content to viewport × zoom and draws ruler ticks', () => {
		renderTimeline();
		expect( screen.getByTestId( 'studio-timeline-content' ) ).toHaveStyle( { width: '1000px' } );
		// pxPerMs 0.1 → 1000ms step → 11 ticks for 10s.
		expect( screen.getAllByTestId( 'studio-timeline-ruler-tick' ) ).toHaveLength( 11 );
	} );

	describe( 'one timeline scale', () => {
		/**
		 * Assert the single-scale invariant: the content element and every
		 * track row render at exactly the same explicit width, so ruler
		 * ticks and filmstrip tiles cannot sit on different horizontal
		 * scales.
		 *
		 * @param width - Expected CSS width, e.g. '1000px'.
		 */
		function expectOneScale( width: string ) {
			expect( screen.getByTestId( 'studio-timeline-content' ) ).toHaveStyle( { width } );
			expect( screen.getByTestId( 'studio-timeline-track-ruler' ) ).toHaveStyle( { width } );
			expect( screen.getByTestId( 'studio-timeline-track-filmstrip' ) ).toHaveStyle( {
				width,
			} );
		}

		it( 'renders the ruler and filmstrip rows at exactly the content width, at fit and zoomed', () => {
			renderTimeline( { filmstrip: storyboardFilmstrip( 50 ) } );
			expectOneScale( '1000px' );

			fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
				target: { value: '3' },
			} );
			expectOneScale( '6400px' );

			// The ruler's last tick (the full duration, at the 200ms step the
			// zoomed pxPerMs of 0.64 selects) lands exactly on the shared
			// width — the tick field spans the same box the tiles fill.
			const ticks = screen.getAllByTestId( 'studio-timeline-ruler-tick' );
			const lastTick = ticks[ ticks.length - 1 ];
			expect( lastTick ).toHaveStyle( { transform: 'translateX(6400px)' } );
			expect( lastTick ).toHaveTextContent( '0:00:10.0' );
		} );

		it( 'regression: a 91s video with a 91-tile storyboard renders fit on one scale', () => {
			// The reported canary case: real 91s video, the wpcom storyboard
			// endpoint's 10×10 sheet (one tile per second), timeline at the
			// default state.
			mockViewportWidth = 910;
			renderTimeline( {
				session: createEditSession( 91000 ),
				filmstrip: storyboard91s(),
			} );

			// Strip fills exactly the fit content width: every row at 910px.
			expectOneScale( '910px' );

			// At fit the quantizer samples every 16th sprite tile (10px per
			// interval against the ≈113.8px cell → density 16): 6 rendered
			// tiles at 160px, the last taking the 110px remainder, summing to
			// exactly the shared content width.
			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles ).toHaveLength( 6 );
			expect( tiles.map( tile => tile.getAttribute( 'data-index' ) ) ).toEqual( [
				'0',
				'16',
				'32',
				'48',
				'64',
				'80',
			] );
			expect( tiles.map( tile => parseFloat( tile.style.width ) ) ).toEqual( [
				160, 160, 160, 160, 160, 110,
			] );
			// A 160px box covers the 160×90 cell at scale 1 — pixel-exact, no
			// upscale: the 10×10 sheet paints at its natural 1600×900.
			expect( tiles[ 0 ] ).toHaveStyle( {
				backgroundSize: '1600px 900px',
				backgroundPosition: '0px -13px',
			} );

			// The ruler spans the full duration inside the same box: fit
			// pxPerMs 0.01 picks the 10s step, so the last tick is 0:01:30 at
			// 900px — within one step of the 91s duration, not clipped at a
			// third of it.
			const ticks = screen.getAllByTestId( 'studio-timeline-ruler-tick' );
			expect( ticks ).toHaveLength( 10 );
			const lastTick = ticks[ ticks.length - 1 ];
			expect( lastTick ).toHaveTextContent( '0:01:30.0' );
			expect( lastTick ).toHaveStyle( { transform: 'translateX(900px)' } );

			// And the zoom control agrees this is fit: slider at the leftmost
			// stop with real travel available (cap ≈ 11.4).
			const slider = screen.getByRole< HTMLInputElement >( 'slider', {
				name: 'Timeline zoom',
			} );
			expect( slider.value ).toBe( '0' );
			expect( slider ).toBeEnabled();
		} );

		it( 'keeps the rows fluid while the viewport is unmeasured', () => {
			mockViewportWidth = 0;
			renderTimeline( { filmstrip: storyboardFilmstrip( 5 ) } );
			// No inline width anywhere: the content and rows fall back to the
			// stylesheet's fluid sizing until the viewport reports a width.
			expect( screen.getByTestId( 'studio-timeline-content' ) ).not.toHaveAttribute( 'style' );
			expect( screen.getByTestId( 'studio-timeline-track-ruler' ) ).not.toHaveAttribute( 'style' );
			expect( screen.getByTestId( 'studio-timeline-track-filmstrip' ) ).not.toHaveAttribute(
				'style'
			);
		} );
	} );

	it( 'positions the playhead from currentMs', () => {
		renderTimeline( { currentMs: 2500 } );
		expect( screen.getByTestId( 'studio-timeline-playhead' ) ).toHaveStyle( {
			transform: 'translateX(250px)',
		} );
	} );

	it( 'scrubs on pointer drag over empty track area, clamped to the duration', () => {
		const { onSeek, dispatch } = renderTimeline();
		const content = screen.getByTestId( 'studio-timeline-content' );

		fireEvent.pointerDown( content, { button: 0, pointerId: 1, clientX: 300 } );
		fireEvent.pointerMove( content, { pointerId: 1, clientX: 420 } );
		fireEvent.pointerMove( content, { pointerId: 1, clientX: 1200 } );
		fireEvent.pointerUp( content, { pointerId: 1 } );

		expect( onSeek.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 3000, 4200, 10000 ] );
		// Scrubbing never touches the edit session or its history.
		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'notifies scrub start and end so the parent can pause playback', () => {
		const onScrubStart = jest.fn();
		const onScrubEnd = jest.fn();
		renderTimeline( { onScrubStart, onScrubEnd } );
		const content = screen.getByTestId( 'studio-timeline-content' );

		fireEvent.pointerDown( content, { button: 0, pointerId: 1, clientX: 300 } );
		expect( onScrubStart ).toHaveBeenCalledTimes( 1 );
		expect( onScrubEnd ).not.toHaveBeenCalled();

		fireEvent.pointerMove( content, { pointerId: 1, clientX: 420 } );
		fireEvent.pointerUp( content, { pointerId: 1 } );
		expect( onScrubEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'deselects the selected cut when a scrub starts', () => {
		const { dispatch } = renderTimeline( { session: sessionWithCut() } );
		fireEvent.pointerDown( screen.getByTestId( 'studio-timeline-content' ), {
			button: 0,
			pointerId: 1,
			clientX: 100,
		} );
		expect( dispatch ).toHaveBeenCalledWith( { type: 'SELECT_CUT', id: null } );
	} );

	it( 'adds a cut at the playhead', async () => {
		const { dispatch } = renderTimeline( { currentMs: 5000 } );
		await userEvent.click( screen.getByRole( 'button', { name: 'New cut' } ) );
		expect( dispatch ).toHaveBeenCalledWith( { type: 'ADD_CUT', atMs: 5000 } );
	} );

	it( 'disables New cut while the playhead is outside the trim window', () => {
		renderTimeline( { session: trimmedSession(), currentMs: 1000 } );
		expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'zooms via the slider up to the filmstrip cap and restores fit', () => {
		// 50 storyboard tiles × 128px native width / 1000px viewport → cap 6.4.
		renderTimeline( { filmstrip: storyboardFilmstrip( 50 ) } );
		const content = screen.getByTestId( 'studio-timeline-content' );

		// The top stop lands exactly on the cap, not some fixed multiplier.
		fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
			target: { value: '3' },
		} );
		expect( content ).toHaveStyle( { width: '6400px' } );

		fireEvent.click( screen.getByRole( 'button', { name: 'Fit' } ) );
		expect( content ).toHaveStyle( { width: '1000px' } );
	} );

	it( 'zooms with modifier+wheel and scrolls with a plain wheel', () => {
		renderTimeline( { filmstrip: storyboardFilmstrip( 50 ) } );
		const content = screen.getByTestId( 'studio-timeline-content' );
		const scroller = screen.getByTestId( 'studio-timeline-scroller' );

		fireEvent.wheel( scroller, { ctrlKey: true, deltaY: -100 } );
		// zoom 1 × exp(0.2) ≈ 1.221 → content grows past the fit width.
		const zoomedWidth = parseFloat( content.style.width );
		expect( zoomedWidth ).toBeGreaterThan( 1000 );

		fireEvent.wheel( scroller, { deltaY: 60 } );
		expect( scroller.scrollLeft ).toBe( 60 );
		// Plain wheel must not zoom.
		expect( parseFloat( content.style.width ) ).toBe( zoomedWidth );
	} );

	describe( 'zoom cap', () => {
		it( 'clamps modifier+wheel zoom at the filmstrip cap', () => {
			renderTimeline( { filmstrip: storyboardFilmstrip( 50 ) } );
			const scroller = screen.getByTestId( 'studio-timeline-scroller' );

			// exp(20) ≈ 4.9e8 — astronomically past the 6.4 cap.
			fireEvent.wheel( scroller, { ctrlKey: true, deltaY: -10000 } );
			expect( screen.getByTestId( 'studio-timeline-content' ) ).toHaveStyle( {
				width: '6400px',
			} );
		} );

		it( 'caps zoom from the duration while the filmstrip is loading', () => {
			// No dimensions yet: assume 1s-per-tile 16:9 cells, so a 10s video
			// caps at 10 × (64 × 16/9) / 1000 ≈ 1.138.
			renderTimeline( { filmstrip: { status: 'loading' } } );

			fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
				target: { value: '3' },
			} );
			const width = parseFloat( screen.getByTestId( 'studio-timeline-content' ).style.width );
			expect( width ).toBeCloseTo( ( 10 * 64 * 16 ) / 9, 6 );
		} );

		it( 'derives the cap from the frame count in frames mode', () => {
			// 30 extracted frames at the 16:9 assumption → cap ≈ 3.413.
			renderTimeline( {
				filmstrip: {
					status: 'frames',
					frames: Array.from( { length: 30 }, ( _, index ) => `blob:frame-${ index }` ),
				},
			} );

			fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
				target: { value: '3' },
			} );
			const width = parseFloat( screen.getByTestId( 'studio-timeline-content' ).style.width );
			expect( width ).toBeCloseTo( ( 30 * 64 * 16 ) / 9, 6 );
		} );

		it( 'disables the slider and ignores wheel zoom when the strip already fits', () => {
			// 5 tiles × 128px = 640px < viewport: no upscale-free zoom range.
			renderTimeline( { filmstrip: storyboardFilmstrip( 5 ) } );
			const content = screen.getByTestId( 'studio-timeline-content' );

			expect( screen.getByRole( 'slider', { name: 'Timeline zoom' } ) ).toBeDisabled();

			fireEvent.wheel( screen.getByTestId( 'studio-timeline-scroller' ), {
				ctrlKey: true,
				deltaY: -100,
			} );
			expect( content ).toHaveStyle( { width: '1000px' } );
		} );

		it( 're-clamps the effective zoom when the viewport grows', () => {
			const { rerender } = renderTimeline( { filmstrip: storyboardFilmstrip( 50 ) } );
			const content = screen.getByTestId( 'studio-timeline-content' );

			fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
				target: { value: '3' },
			} );
			expect( content ).toHaveStyle( { width: '6400px' } );

			// Doubling the viewport halves the cap (6.4 → 3.2). The stored zoom
			// (6.4) now overshoots; the effective zoom must re-clamp so the
			// strip tops out at tiles × native width — 6400px — instead of the
			// unclamped 2000 × 6.4 = 12800px.
			mockViewportWidth = 2000;
			rerender();
			expect( content ).toHaveStyle( { width: '6400px' } );
		} );
	} );

	describe( 'discrete zoom ladder', () => {
		it( 'renders the filmstrip through the quantizer at wheel zooms between stops', () => {
			// The wheel path stays continuous: one ctrl+wheel notch lands at
			// zoom e^0.2 ≈ 1.221, between stops 0 and 1 of the 91s fixture's
			// ladder (cap ≈11.38).
			mockViewportWidth = 910;
			renderTimeline( {
				session: createEditSession( 91000 ),
				filmstrip: storyboard91s(),
			} );

			fireEvent.wheel( screen.getByTestId( 'studio-timeline-scroller' ), {
				ctrlKey: true,
				deltaY: -100,
			} );

			// ≈12.2px per interval against the ≈113.8px cell → density 8:
			// 12 sampled tiles whose widths still sum to the exact zoomed
			// content width — no seams at off-stop zooms.
			const tiles = screen.getAllByTestId( 'studio-timeline-filmstrip-tile' );
			expect( tiles ).toHaveLength( 12 );
			const contentWidth = parseFloat(
				screen.getByTestId( 'studio-timeline-content' ).style.width
			);
			expect( contentWidth ).toBeCloseTo( 910 * Math.exp( 0.2 ), 6 );
			const sum = tiles.reduce( ( total, tile ) => total + parseFloat( tile.style.width ), 0 );
			expect( sum ).toBeCloseTo( contentWidth, 6 );

			// The slider shows the nearest stop without snapping the state.
			expect(
				screen.getByRole< HTMLInputElement >( 'slider', { name: 'Timeline zoom' } ).value
			).toBe( '0' );
		} );

		it( 'keeps the playhead stationary across a discrete zoom jump', () => {
			// 100 one-second tiles at 128px native width → cap 12.8. Playhead
			// mid-video sits at 500px on screen at fit.
			renderTimeline( {
				session: createEditSession( 100000 ),
				filmstrip: storyboardFilmstrip( 100 ),
				currentMs: 50000,
			} );
			const scroller = screen.getByTestId( 'studio-timeline-scroller' );
			// jsdom has no layout: give the scroller the post-zoom geometry so
			// the compensation isn't clamped into a zero scroll range.
			Object.defineProperties( scroller, {
				scrollWidth: { value: 12800, configurable: true },
				clientWidth: { value: 1000, configurable: true },
			} );

			// Jump from fit straight to the top stop (zoom 12.8) — the
			// playhead-anchored compensation is zoom-delta-agnostic, so the
			// discrete jump rides the same path as small wheel deltas.
			fireEvent.change( screen.getByRole( 'slider', { name: 'Timeline zoom' } ), {
				target: { value: '3' },
			} );

			// The playhead lands at 50000ms × 0.128px/ms = 6400px; keeping it
			// at its old 500px screen offset needs scrollLeft 5900.
			expect( scroller.scrollLeft ).toBeCloseTo( 5900, 6 );
		} );
	} );

	describe( 'transport (relocated from the preview player)', () => {
		it( 'toggles playback from the transport button', async () => {
			const { onTogglePlay } = renderTimeline();
			const button = screen.getByTestId( 'studio-timeline-transport-play' );
			expect( button ).toHaveAccessibleName( 'Play' );
			await userEvent.click( button );
			expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'shows the pause affordance while playing', () => {
			renderTimeline( { playing: true } );
			expect( screen.getByTestId( 'studio-timeline-transport-play' ) ).toHaveAccessibleName(
				'Pause'
			);
		} );

		it( 'shows the session duration next to the timecode box', () => {
			renderTimeline();
			expect( screen.getByText( '/ 0:00:10.0' ) ).toBeInTheDocument();
		} );

		it( 'seeks from the toolbar timecode box', async () => {
			const { onSeek } = renderTimeline();
			const input = screen.getByRole( 'textbox', { name: 'Playhead time' } );
			await userEvent.clear( input );
			await userEvent.type( input, '3{Enter}' );
			expect( onSeek ).toHaveBeenCalledWith( 3000 );
		} );

		it( 'reverts a draft timecode on Escape', async () => {
			const { onSeek } = renderTimeline();
			const input = screen.getByRole( 'textbox', { name: 'Playhead time' } );
			await userEvent.clear( input );
			await userEvent.type( input, '5{Escape}' );
			expect( input ).toHaveValue( '0:00:00.0' );
			expect( onSeek ).not.toHaveBeenCalled();
		} );

		it( 'ignores an unparseable timecode on blur', async () => {
			const { onSeek } = renderTimeline();
			const input = screen.getByRole( 'textbox', { name: 'Playhead time' } );
			await userEvent.clear( input );
			await userEvent.type( input, 'not a time' );
			await userEvent.tab();
			expect( input ).toHaveValue( '0:00:00.0' );
			expect( onSeek ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'processing lock', () => {
		it( 'scopes the locked modifier to the scroller, keeping the toolbar usable', async () => {
			const { onTogglePlay } = renderTimeline( { locked: true } );
			// The pointer-events block targets the scroller region only; the
			// toolbar (transport, zoom) sits outside it and stays interactive.
			expect( screen.getByTestId( 'studio-timeline-scroller' ) ).toHaveClass(
				'vp-studio-timeline__scroller--locked'
			);
			await userEvent.click( screen.getByTestId( 'studio-timeline-transport-play' ) );
			expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'leaves the scroller unlocked by default', () => {
			renderTimeline();
			expect( screen.getByTestId( 'studio-timeline-scroller' ) ).not.toHaveClass(
				'vp-studio-timeline__scroller--locked'
			);
		} );
	} );

	describe( 'document-level shortcuts', () => {
		it( 'space toggles playback', () => {
			const { onTogglePlay } = renderTimeline();
			fireEvent.keyDown( document.body, { key: ' ' } );
			expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'arrows nudge the playhead, clamped at the edges', () => {
			const { onSeek } = renderTimeline( { currentMs: 200 } );
			fireEvent.keyDown( document.body, { key: 'ArrowRight' } );
			fireEvent.keyDown( document.body, { key: 'ArrowRight', shiftKey: true } );
			fireEvent.keyDown( document.body, { key: 'ArrowLeft', shiftKey: true } );
			expect( onSeek.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 300, 1200, 0 ] );
		} );

		it( 'Home and End jump to the trim points', () => {
			const { onSeek } = renderTimeline( { session: trimmedSession() } );
			fireEvent.keyDown( document.body, { key: 'Home' } );
			fireEvent.keyDown( document.body, { key: 'End' } );
			expect( onSeek.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 2000, 8000 ] );
		} );

		it( 'Delete removes the selected cut', () => {
			const { dispatch } = renderTimeline( { session: sessionWithCut() } );
			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( dispatch.mock.calls ).toEqual( [ [ { type: 'REMOVE_CUT', id: 'cut-a' } ] ] );
		} );

		it( 'Delete is a no-op without a selection', () => {
			const { dispatch } = renderTimeline();
			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( dispatch ).not.toHaveBeenCalled();
		} );

		it( 'mod+Z undoes and shift+mod+Z redoes', () => {
			const { dispatch } = renderTimeline();
			fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true } );
			fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true, shiftKey: true } );
			expect( dispatch.mock.calls ).toEqual( [ [ { type: 'UNDO' } ], [ { type: 'REDO' } ] ] );
		} );

		it( 'typing in the timecode box never toggles playback', () => {
			const { onTogglePlay } = renderTimeline();
			fireEvent.keyDown( screen.getByRole( 'textbox', { name: 'Playhead time' } ), {
				key: ' ',
			} );
			expect( onTogglePlay ).not.toHaveBeenCalled();
		} );

		it( 'detach entirely while shortcutsEnabled is false (e.g. a dialog is open)', () => {
			const { onTogglePlay, dispatch } = renderTimeline( {
				session: sessionWithCut(),
				shortcutsEnabled: false,
			} );
			fireEvent.keyDown( document.body, { key: ' ' } );
			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( onTogglePlay ).not.toHaveBeenCalled();
			expect( dispatch ).not.toHaveBeenCalled();
		} );
	} );

	it( 'nudges via the focusable playhead without double-firing the document shortcut', () => {
		const { onSeek } = renderTimeline( { currentMs: 500 } );
		fireEvent.keyDown( screen.getByTestId( 'studio-timeline-playhead' ), {
			key: 'ArrowRight',
		} );
		expect( onSeek.mock.calls ).toEqual( [ [ 600 ] ] );
	} );

	it( 'exposes slider semantics on the playhead', () => {
		renderTimeline( { currentMs: 2500 } );
		const playhead = screen.getByTestId( 'studio-timeline-playhead' );
		expect( playhead ).toHaveAttribute( 'role', 'slider' );
		expect( playhead ).toHaveAttribute( 'aria-valuemin', '0' );
		expect( playhead ).toHaveAttribute( 'aria-valuemax', '10000' );
		expect( playhead ).toHaveAttribute( 'aria-valuenow', '2500' );
		// Raw milliseconds are meaningless to a screen reader; the timecode
		// mirrors the trim/cut sliders' aria-valuetext.
		expect( playhead ).toHaveAttribute( 'aria-valuetext', '0:00:02.5' );
	} );
} );

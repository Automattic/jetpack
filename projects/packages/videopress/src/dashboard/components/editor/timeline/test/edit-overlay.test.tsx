/* eslint-disable testing-library/prefer-user-event -- Drag gestures need raw pointer events carrying clientX/pointerId (userEvent has no pointer-capture drag primitive), and the slider handles under test respond to raw keydowns. */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEditSession, editSessionReducer } from '../../state/edit-session';
import StudioEditorEditOverlay from '../edit-overlay';
import type { EditSession, EditSessionAction } from '../../state/edit-session';

// jsdom (27) ships PointerEvent but not the pointer-capture element APIs the
// drag hook calls; stub them so pointerdown handlers run.
beforeAll( () => {
	Object.assign( Element.prototype, {
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
		hasPointerCapture: () => false,
	} );
} );

// All tests use pxPerMs 0.1: 1px = 10ms, snap threshold 8px = 80ms, and the
// detached content element's rect sits at x = 0, so clientX * 10 = ms.
const PX_PER_MS = 0.1;

/**
 * A 10s session with one cut from 4000 to 6000ms (selected — ADD_CUT selects
 * the cut it creates).
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
 * A 10s session with two cuts: cut-a [1000, 2000] and cut-b [4000, 6000].
 *
 * @return The session.
 */
function sessionWithTwoCuts(): EditSession {
	const withA = editSessionReducer( createEditSession( 10000 ), {
		type: 'ADD_CUT',
		atMs: 1500,
		halfSpanMs: 500,
		id: 'cut-a',
	} );
	return editSessionReducer( withA, {
		type: 'ADD_CUT',
		atMs: 5000,
		halfSpanMs: 1000,
		id: 'cut-b',
	} );
}

/**
 * Render the overlay against a detached content element.
 *
 * @param session   - The session to render.
 * @param currentMs - Playhead position (snap target for cut edges).
 * @return The dispatch and onSeek spies, plus a session re-render helper.
 */
function renderOverlay( session: EditSession, currentMs = 0 ) {
	const dispatch = jest.fn();
	const onSeek = jest.fn();
	const contentRef = { current: document.createElement( 'div' ) };
	const overlay = ( s: EditSession ) => (
		<StudioEditorEditOverlay
			session={ s }
			currentMs={ currentMs }
			pxPerMs={ PX_PER_MS }
			contentRef={ contentRef }
			dispatch={ dispatch }
			onSeek={ onSeek }
		/>
	);
	const { rerender } = render( overlay( session ) );
	return { dispatch, onSeek, rerenderSession: ( s: EditSession ) => rerender( overlay( s ) ) };
}

/**
 * Shorthand for a TRANSIENT-wrapped session action.
 *
 * @param action - The inner action.
 * @return The wrapped action.
 */
function transient( action: EditSessionAction ) {
	return { type: 'TRANSIENT', action };
}

/**
 * Shorthand for a from-base TRANSIENT-wrapped session action (body moves
 * replay against the gesture's base state).
 *
 * @param action - The inner action.
 * @return The wrapped action.
 */
function transientFromBase( action: EditSessionAction ) {
	return { type: 'TRANSIENT', fromBase: true, action };
}

describe( 'StudioEditorTrimHandles', () => {
	it( 'drags the trim start with transient moves, one commit, and preview seeks', () => {
		const { dispatch, onSeek } = renderOverlay( createEditSession( 10000 ) );
		const handle = screen.getByTestId( 'studio-timeline-trim-start' );

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1, clientX: 0 } );
		fireEvent.pointerMove( handle, { pointerId: 1, clientX: 200 } );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( dispatch.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			transient( { type: 'SET_TRIM_START', ms: 0 } ),
			transient( { type: 'SET_TRIM_START', ms: 2000 } ),
			{ type: 'COMMIT' },
		] );
		expect( onSeek.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 0, 2000 ] );
	} );

	it( 'preserves the grab offset instead of jumping the handle to the pointer', () => {
		const { dispatch } = renderOverlay( createEditSession( 10000 ) );
		const handle = screen.getByTestId( 'studio-timeline-trim-end' );

		// Trim end sits at 10000ms = 1000px; grab it 4px left of center, so the
		// reported positions run 40ms ahead of the raw pointer time.
		fireEvent.pointerDown( handle, { button: 0, pointerId: 1, clientX: 996 } );
		fireEvent.pointerMove( handle, { pointerId: 1, clientX: 800 } );

		expect( dispatch ).toHaveBeenLastCalledWith( transient( { type: 'SET_TRIM_END', ms: 8040 } ) );
	} );

	it( 'snaps a trim drag to a nearby cut edge', () => {
		const { dispatch } = renderOverlay( sessionWithCut() );
		const handle = screen.getByTestId( 'studio-timeline-trim-start' );

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1, clientX: 0 } );
		// 3960ms is within the 80ms snap radius of the cut edge at 4000ms.
		fireEvent.pointerMove( handle, { pointerId: 1, clientX: 396 } );

		expect( dispatch ).toHaveBeenLastCalledWith(
			transient( { type: 'SET_TRIM_START', ms: 4000 } )
		);
	} );

	it( 'seeks to the reducer-clamped time when a drag passes the minimum-output floor', () => {
		const { dispatch, onSeek } = renderOverlay( createEditSession( 10000 ) );
		const handle = screen.getByTestId( 'studio-timeline-trim-start' );

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1, clientX: 0 } );
		// 9500ms would leave a 500ms output; the reducer clamps to 9000ms.
		fireEvent.pointerMove( handle, { pointerId: 1, clientX: 950 } );

		expect( dispatch ).toHaveBeenLastCalledWith(
			transient( { type: 'SET_TRIM_START', ms: 9500 } )
		);
		expect( onSeek ).toHaveBeenLastCalledWith( 9000 );
	} );

	it( 'ignores non-primary buttons', () => {
		const { dispatch } = renderOverlay( createEditSession( 10000 ) );
		const handle = screen.getByTestId( 'studio-timeline-trim-start' );
		fireEvent.pointerDown( handle, { button: 2, pointerId: 1, clientX: 100 } );
		fireEvent.pointerMove( handle, { pointerId: 1, clientX: 200 } );
		expect( dispatch ).not.toHaveBeenCalled();
	} );

	it( 'nudges with arrow keys as plain (undoable) actions and seeks', () => {
		const { dispatch, onSeek } = renderOverlay( createEditSession( 10000 ) );
		const handle = screen.getByTestId( 'studio-timeline-trim-start' );

		fireEvent.keyDown( handle, { key: 'ArrowRight' } );
		fireEvent.keyDown( handle, { key: 'ArrowRight', shiftKey: true } );

		expect( dispatch.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			{ type: 'SET_TRIM_START', ms: 100 },
			{ type: 'SET_TRIM_START', ms: 1000 },
		] );
		expect( onSeek.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 100, 1000 ] );
	} );

	it( 'renders shrouds only outside the trim window', () => {
		let session = createEditSession( 10000 );
		session = editSessionReducer( session, { type: 'SET_TRIM_START', ms: 2000 } );
		session = editSessionReducer( session, { type: 'SET_TRIM_END', ms: 8000 } );
		renderOverlay( session );

		expect( screen.getByTestId( 'studio-timeline-shroud-start' ) ).toHaveStyle( {
			width: '200px',
		} );
		expect( screen.getByTestId( 'studio-timeline-shroud-end' ) ).toHaveStyle( {
			left: '800px',
			width: '200px',
		} );
	} );

	it( 'renders no shrouds for a full-range session', () => {
		renderOverlay( createEditSession( 10000 ) );
		expect( screen.queryByTestId( 'studio-timeline-shroud-start' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'studio-timeline-shroud-end' ) ).not.toBeInTheDocument();
	} );

	it( 'exposes slider semantics on the handles', () => {
		renderOverlay( sessionWithCut() );
		const handle = screen.getByTestId( 'studio-timeline-trim-end' );
		expect( handle ).toHaveAttribute( 'role', 'slider' );
		expect( handle ).toHaveAttribute( 'aria-valuemin', '0' );
		expect( handle ).toHaveAttribute( 'aria-valuemax', '10000' );
		expect( handle ).toHaveAttribute( 'aria-valuenow', '10000' );
		expect( handle ).toHaveAttribute( 'aria-valuetext', '0:00:10.0' );
	} );
} );

describe( 'StudioEditorCutSegment', () => {
	it( 'drags a cut edge: selection joins the gesture, moves are transient, one commit', () => {
		const { dispatch } = renderOverlay( sessionWithCut() );
		const edge = screen.getByTestId( 'studio-timeline-cut-start-cut-a' );

		fireEvent.pointerDown( edge, { button: 0, pointerId: 1, clientX: 400 } );
		fireEvent.pointerMove( edge, { pointerId: 1, clientX: 300 } );
		fireEvent.pointerUp( edge, { pointerId: 1 } );

		expect( dispatch.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			transient( { type: 'SELECT_CUT', id: 'cut-a' } ),
			transient( { type: 'UPDATE_CUT', id: 'cut-a', startMs: 4000 } ),
			transient( { type: 'UPDATE_CUT', id: 'cut-a', startMs: 3000 } ),
			{ type: 'COMMIT' },
		] );
	} );

	it( 'snaps a cut edge to the playhead', () => {
		const { dispatch } = renderOverlay( sessionWithCut(), 3500 );
		const edge = screen.getByTestId( 'studio-timeline-cut-start-cut-a' );

		fireEvent.pointerDown( edge, { button: 0, pointerId: 1, clientX: 400 } );
		// 3550ms is within the 80ms snap radius of the playhead at 3500ms.
		fireEvent.pointerMove( edge, { pointerId: 1, clientX: 355 } );

		expect( dispatch ).toHaveBeenLastCalledWith(
			transient( { type: 'UPDATE_CUT', id: 'cut-a', startMs: 3500 } )
		);
	} );

	it( 'drags the cut body: selection joins the gesture, width-preserving moves, one commit', () => {
		const { dispatch } = renderOverlay( sessionWithCut() );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-a' );

		// Grab 500ms into the cut: moves report where the START should land,
		// preserving the grab offset.
		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 450 } );
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 250 } );
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 260 } );
		fireEvent.pointerUp( body, { pointerId: 1 } );

		expect( dispatch.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			transient( { type: 'SELECT_CUT', id: 'cut-a' } ),
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 4000 } ),
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 2000 } ),
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 2100 } ),
			{ type: 'COMMIT' },
		] );
	} );

	it( 'selects on a no-move body click, dispatching only no-op moves', () => {
		const { dispatch } = renderOverlay( sessionWithCut(), 4050 );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-a' );

		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 500 } );
		fireEvent.pointerUp( body, { pointerId: 1 } );

		// The playhead at 4050 is within snap range of the un-moved start, but
		// a click must never nudge the cut: snapping only engages once the
		// pointer actually moves it. The reducer treats the same-position move
		// as a no-op and the history wrapper commits no undo entry (selection
		// is not history-relevant).
		expect( dispatch.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			transient( { type: 'SELECT_CUT', id: 'cut-a' } ),
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 4000 } ),
			{ type: 'COMMIT' },
		] );
	} );

	it( 'snaps a body move on its leading edge', () => {
		const { dispatch } = renderOverlay( sessionWithCut(), 3000 );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-a' );

		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 450 } );
		// Raw start 3050 is within the 80ms radius of the playhead at 3000.
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 355 } );

		expect( dispatch ).toHaveBeenLastCalledWith(
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 3000 } )
		);
	} );

	it( 'snaps a body move on its trailing edge when that is the closer candidate', () => {
		// A second cut at [7000, 7500] provides the trailing-edge target.
		const session = editSessionReducer( sessionWithCut(), {
			type: 'ADD_CUT',
			atMs: 7250,
			halfSpanMs: 250,
			id: 'cut-b',
		} );
		const { dispatch } = renderOverlay( session );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-a' );

		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 450 } );
		// Raw start 4960 → raw end 6960: 40ms from cut-b's start (in range),
		// while no target is near the leading edge — the end snap wins and the
		// start lands at 7000 − width.
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 546 } );

		expect( dispatch ).toHaveBeenLastCalledWith(
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-a', startMs: 5000 } )
		);
	} );

	it( 'keeps snapping to a swallowed neighbor edge after a mid-drag merge preview', () => {
		const session = sessionWithTwoCuts();
		const { dispatch, rerenderSession } = renderOverlay( session );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-b' );

		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 450 } );
		// Mid-gesture the session shows the merge PREVIEW: cut-b has swallowed
		// cut-a and spans [1000, 6000] — so cut-a's edges only exist in the
		// gesture-start snapshot.
		rerenderSession( {
			...session,
			cuts: [ { id: 'cut-b', startMs: 1000, endMs: 6000 } ],
			selectedCutId: 'cut-b',
		} );

		// Raw start 2050 is within the 80ms radius of cut-a's end at 2000.
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 255 } );
		expect( dispatch ).toHaveBeenLastCalledWith(
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-b', startMs: 2000 } )
		);
	} );

	it( 'keeps the grab-time width for trailing-edge snaps after a mid-drag merge preview', () => {
		const session = sessionWithTwoCuts();
		const { dispatch, rerenderSession } = renderOverlay( session, 7000 );
		const body = screen.getByTestId( 'studio-timeline-cut-cut-b' );

		fireEvent.pointerDown( body, { button: 0, pointerId: 1, clientX: 450 } );
		rerenderSession( {
			...session,
			cuts: [ { id: 'cut-b', startMs: 1000, endMs: 6000 } ],
			selectedCutId: 'cut-b',
		} );

		// Raw start 4960 → raw end 6960 with the grab-time 2000ms width: 40ms
		// from the playhead at 7000. The merged preview's 5000ms width would
		// find no snap target at all.
		fireEvent.pointerMove( body, { pointerId: 1, clientX: 546 } );
		expect( dispatch ).toHaveBeenLastCalledWith(
			transientFromBase( { type: 'MOVE_CUT', id: 'cut-b', startMs: 5000 } )
		);
	} );

	it( 'marks the selected cut', () => {
		renderOverlay( sessionWithCut() );
		expect( screen.getByTestId( 'studio-timeline-cut-cut-a' ) ).toHaveClass(
			'vp-studio-timeline__cut--selected'
		);
	} );

	it( 'removes the cut via the ✕ button without selecting it first', async () => {
		const { dispatch } = renderOverlay( sessionWithCut() );
		await userEvent.click( screen.getByRole( 'button', { name: 'Remove cut' } ) );
		expect( dispatch.mock.calls ).toEqual( [ [ { type: 'REMOVE_CUT', id: 'cut-a' } ] ] );
	} );

	it( 'nudges a cut edge with arrow keys', () => {
		const { dispatch } = renderOverlay( sessionWithCut() );
		fireEvent.keyDown( screen.getByTestId( 'studio-timeline-cut-end-cut-a' ), {
			key: 'ArrowLeft',
		} );
		expect( dispatch.mock.calls ).toEqual( [
			[ { type: 'UPDATE_CUT', id: 'cut-a', endMs: 5900 } ],
		] );
	} );

	it( 'positions the segment from the cut range', () => {
		renderOverlay( sessionWithCut() );
		expect( screen.getByTestId( 'studio-timeline-cut-cut-a' ) ).toHaveStyle( {
			left: '400px',
			width: '200px',
		} );
	} );
} );

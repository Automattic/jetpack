/* eslint-disable testing-library/prefer-user-event -- Drag gestures need raw pointer events carrying clientX/pointerId (userEvent has no pointer-capture drag primitive), and the shortcuts under test listen for raw keydowns on document. */
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import {
	chaptersEditsEqual,
	chaptersSessionReducer,
	createChaptersSession,
} from '../../state/chapters-session';
import { canUndo, createHistory, withHistory } from '../../state/history';
import ChaptersTimeline from '../chapters-timeline';
import type { ChapterRow } from '../../../../utils/video-chapters/description';
import type { ChaptersSession, ChaptersSessionAction } from '../../state/chapters-session';
import type { ChaptersTimelineProps } from '../chapters-timeline';
import type { ReactElement } from 'react';

// jsdom reports zero layout, so inject the viewport width: with the 60s
// sessions below at 1000px, zoom 1 gives pxPerMs 1/60 (clientX × 60 = ms).
jest.mock( '../../timeline/use-element-width', () => ( {
	useElementWidth: () => ( { ref: () => {}, width: 1000 } ),
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

const historyReducer = withHistory< ChaptersSession, ChaptersSessionAction >(
	chaptersSessionReducer,
	{
		clearOn: action => action.type === 'LOAD',
		equals: chaptersEditsEqual,
	}
);

/**
 * The default fixture: three chapters at 0/10/30s on a 60s video.
 *
 * @return The chapter rows.
 */
function defaultRows(): ChapterRow[] {
	return [
		{ startAtSeconds: 0, title: 'Intro' },
		{ startAtSeconds: 10, title: 'Middle' },
		{ startAtSeconds: 30, title: 'End' },
	];
}

type HarnessProps = Partial< ChaptersTimelineProps > & {
	rows?: ChapterRow[];
	durationMs?: number;
};

/**
 * The timeline under a REAL history-wrapped store, so gestures, coalescing,
 * and undo semantics are exercised end to end. An extra harness button
 * dispatches UNDO and a probe span reports canUndo.
 *
 * @param props            - Timeline prop overrides plus the initial rows/duration.
 * @param props.rows       - Rows LOADed into the store at mount.
 * @param props.durationMs - Video duration in ms.
 * @return The harness element.
 */
function Harness( { rows, durationMs = 60000, ...overrides }: HarnessProps ): ReactElement {
	const [ history, dispatch ] = useReducer( historyReducer, undefined, () =>
		createHistory(
			chaptersSessionReducer( createChaptersSession( durationMs ), {
				type: 'LOAD',
				rows: rows ?? defaultRows(),
				durationMs,
			} )
		)
	);
	return (
		<>
			<ChaptersTimeline
				session={ history.present }
				dispatch={ dispatch }
				currentMs={ 0 }
				onSeek={ () => {} }
				onTogglePlay={ () => {} }
				playing={ false }
				{ ...overrides }
			/>
			<button data-testid="harness-undo" onClick={ () => dispatch( { type: 'UNDO' } ) }>
				harness undo
			</button>
			<span data-testid="harness-can-undo">
				{ String( canUndo( history, chaptersEditsEqual ) ) }
			</span>
		</>
	);
}

/**
 * Render the harness.
 *
 * @param props - Harness props.
 * @return A rerender helper bound to the same harness (state survives).
 */
function renderChapters( props: HarnessProps = {} ) {
	const view = render( <Harness { ...props } /> );
	return {
		rerender: ( next: HarnessProps = {} ) => view.rerender( <Harness { ...props } { ...next } /> ),
	};
}

const segments = () => screen.getAllByTestId( /^chapters-segment-/ );
const markers = () => screen.queryAllByTestId( /^chapters-marker-/ );
const addButton = () => screen.getByRole( 'button', { name: 'Add chapter at playhead' } );
const isAriaDisabled = ( el: HTMLElement ) => el.getAttribute( 'aria-disabled' ) === 'true';

describe( 'ChaptersTimeline', () => {
	describe( 'strip', () => {
		it( 'renders segments spanning start → next start, the last running to the video end', () => {
			renderChapters();
			const [ intro, middle, end ] = segments();
			// pxPerMs 1/60: 10000ms ≈ 166.67px, 30000ms = 500px.
			expect( parseFloat( intro.style.left ) ).toBeCloseTo( 0 );
			expect( parseFloat( intro.style.width ) ).toBeCloseTo( 10000 / 60 );
			expect( parseFloat( middle.style.left ) ).toBeCloseTo( 10000 / 60 );
			expect( parseFloat( middle.style.width ) ).toBeCloseTo( 20000 / 60 );
			expect( parseFloat( end.style.left ) ).toBeCloseTo( 500 );
			expect( parseFloat( end.style.width ) ).toBeCloseTo( 500 );
			expect( intro ).toHaveTextContent( 'Intro' );
			expect( middle ).toHaveTextContent( 'Middle' );
			expect( end ).toHaveTextContent( 'End' );
		} );

		it( 'draws a marker for every chapter except the pinned first', () => {
			renderChapters();
			const found = markers();
			expect( found ).toHaveLength( 2 );
			expect( found[ 0 ] ).toHaveAttribute( 'aria-valuenow', '10000' );
			expect( found[ 1 ] ).toHaveAttribute( 'aria-valuenow', '30000' );
			// Clamp windows: prev+1s … next−1s; the last is capped at duration−1s.
			expect( found[ 0 ] ).toHaveAttribute( 'aria-valuemin', '1000' );
			expect( found[ 0 ] ).toHaveAttribute( 'aria-valuemax', '29000' );
			expect( found[ 1 ] ).toHaveAttribute( 'aria-valuemin', '11000' );
			expect( found[ 1 ] ).toHaveAttribute( 'aria-valuemax', '59000' );
		} );

		it( 'keeps a zero-length segment visible instead of collapsing it to 0px', () => {
			// LOAD reflects the description as-is, so a hand-typed duplicate
			// timestamp reaches the strip. A 0px segment would be invisible AND
			// unclickable while still occupying a row below.
			renderChapters( {
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 30, title: 'Alpha' },
					{ startAtSeconds: 30, title: 'Beta' },
					{ startAtSeconds: 50, title: 'Outro' },
				],
			} );

			const alpha = segments()[ 1 ];
			expect( alpha ).toHaveTextContent( 'Alpha' );
			expect( parseFloat( alpha.style.width ) ).toBe( 4 );
		} );

		it( 'selects a chapter on segment pointer-down and lets the press bubble to the scrub surface', () => {
			const onSeek = jest.fn();
			renderChapters( { onSeek } );
			const middle = segments()[ 1 ];

			fireEvent.pointerDown( middle, { button: 0, pointerId: 1, clientX: 200 } );

			expect( middle.className ).toContain( 'vp-chapters__segment--selected' );
			// The same press scrubbed the playhead to the click (200px → 12000ms).
			expect( onSeek ).toHaveBeenCalledWith( 12000 );
		} );
	} );

	describe( 'marker drags', () => {
		it( 'moves a start clamped to the neighbor gap and coalesces the drag into one undo entry', () => {
			renderChapters();
			const marker = markers()[ 0 ];

			fireEvent.pointerDown( marker, { button: 0, pointerId: 1, clientX: 100 } );
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 205 } );
			// 800px → pointer 48000ms + 4000ms grab offset → 52000, clamped to
			// next−1s = 29000.
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 800 } );
			fireEvent.pointerUp( marker, { pointerId: 1 } );

			expect( marker ).toHaveAttribute( 'aria-valuenow', '29000' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'true' );

			// ONE undo entry for the whole gesture: straight back to 10s, and
			// nothing older to undo.
			fireEvent.click( screen.getByTestId( 'harness-undo' ) );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '10000' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );
		} );

		it( 'quantizes the commit to a whole second while the drag tracks raw ms', () => {
			renderChapters();
			const marker = markers()[ 0 ];

			fireEvent.pointerDown( marker, { button: 0, pointerId: 1, clientX: 100 } );
			// 205px → pointer 12300ms + 4000ms grab offset → raw 16300 mid-drag.
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 205 } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '16300' );

			fireEvent.pointerUp( marker, { pointerId: 1 } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '16000' );
		} );

		it( 'quantizes a drag against a fractional video end to a whole second', () => {
			// The last marker's clamp ceiling is duration − 1s = 59900 — itself
			// fractional. The commit must land a whole second inside the window
			// (59000), not silently keep the raw clamped 59900 (the old
			// round-then-clamp behavior: round(59900) = 60000 re-clamps to
			// 59900, a no-op).
			renderChapters( { durationMs: 60900 } );
			const marker = markers()[ 1 ];

			fireEvent.pointerDown( marker, { button: 0, pointerId: 1, clientX: 500 } );
			// Far past the right edge: the clamp saturates, so the grab-offset
			// math is irrelevant and the drag parks on the fractional ceiling.
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 1300 } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '59900' );

			fireEvent.pointerUp( marker, { pointerId: 1 } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '59000' );
		} );

		it( 'commits nothing for a drag that returns to its start', () => {
			renderChapters();
			const marker = markers()[ 0 ];

			fireEvent.pointerDown( marker, { button: 0, pointerId: 1, clientX: 100 } );
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 205 } );
			fireEvent.pointerMove( marker, { pointerId: 1, clientX: 100 } );
			fireEvent.pointerUp( marker, { pointerId: 1 } );

			expect( marker ).toHaveAttribute( 'aria-valuenow', '10000' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );
		} );

		it( 'nudges a start by whole seconds with arrow keys', () => {
			renderChapters();
			const marker = markers()[ 0 ];

			fireEvent.keyDown( marker, { key: 'ArrowLeft' } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '9000' );
			fireEvent.keyDown( marker, { key: 'ArrowRight' } );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '10000' );

			// Each nudge folds its transient gesture into ONE undo entry.
			fireEvent.click( screen.getByTestId( 'harness-undo' ) );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '9000' );
			fireEvent.click( screen.getByTestId( 'harness-undo' ) );
			expect( marker ).toHaveAttribute( 'aria-valuenow', '10000' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );
		} );

		it( 'keeps keyboard nudges on the second grid at a fractional duration clamp', () => {
			// A 60.9s video caps the last marker at 59900 — itself fractional.
			// ArrowRight from 59000 clamps there, and a bare committed
			// MOVE_START used to record the raw 59900 (an off-grid start that
			// disagrees with the whole second Save writes). The nudge must
			// close like a drag: QUANTIZE back onto the grid — here its own
			// start — and commit nothing.
			renderChapters( {
				rows: [
					{ startAtSeconds: 0, title: 'A' },
					{ startAtSeconds: 59, title: 'B' },
				],
				durationMs: 60900,
			} );
			const marker = markers()[ 0 ];
			expect( marker ).toHaveAttribute( 'aria-valuenow', '59000' );

			fireEvent.keyDown( marker, { key: 'ArrowRight' } );

			expect( marker ).toHaveAttribute( 'aria-valuenow', '59000' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );
		} );
	} );

	describe( 'add chapter at playhead', () => {
		it( 'is inert on a taken second and inside the dedupe radius of an existing start', () => {
			const { rerender } = renderChapters( { currentMs: 0 } );
			expect( isAriaDisabled( addButton() ) ).toBe( true );

			rerender( { currentMs: 400 } );
			expect( isAriaDisabled( addButton() ) ).toBe( true );

			rerender( { currentMs: 10200 } );
			expect( isAriaDisabled( addButton() ) ).toBe( true );

			rerender( { currentMs: 5000 } );
			expect( isAriaDisabled( addButton() ) ).toBe( false );
		} );

		it( 'adds a default-titled chapter at the playhead second and selects it', async () => {
			const user = userEvent.setup();
			renderChapters( { currentMs: 5400 } );

			await user.click( addButton() );

			expect( segments() ).toHaveLength( 4 );
			const added = segments()[ 1 ];
			// Numbered by insertion position, not by the chapter count.
			expect( added ).toHaveTextContent( 'Chapter 2' );
			expect( added.className ).toContain( 'vp-chapters__segment--selected' );
			// Whole-second rounding: 5400 → 5000.
			expect( markers()[ 0 ] ).toHaveAttribute( 'aria-valuenow', '5000' );
		} );
	} );

	describe( 'rows list', () => {
		it( 'commits a title draft on blur, not per keystroke, and undoes as one entry', () => {
			renderChapters();
			const input = screen.getByLabelText( 'Chapter 1 title' );

			fireEvent.change( input, { target: { value: 'Updated intro' } } );
			// Draft only: the session still has the old title.
			expect( segments()[ 0 ] ).toHaveTextContent( 'Intro' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );

			fireEvent.blur( input );
			expect( segments()[ 0 ] ).toHaveTextContent( 'Updated intro' );

			fireEvent.click( screen.getByTestId( 'harness-undo' ) );
			expect( segments()[ 0 ] ).toHaveTextContent( 'Intro' );
			expect( input ).toHaveValue( 'Intro' );
		} );

		it( 'commits a title draft on Enter', () => {
			renderChapters();
			const input = screen.getByLabelText( 'Chapter 2 title' );

			fireEvent.change( input, { target: { value: 'Second act' } } );
			fireEvent.keyDown( input, { key: 'Enter' } );

			expect( segments()[ 1 ] ).toHaveTextContent( 'Second act' );
		} );

		it( 'reverts a title draft on Escape and marks the key handled so modal hosts do not also close', () => {
			renderChapters();
			const input = screen.getByLabelText( 'Chapter 2 title' ) as HTMLInputElement;
			// Focusing selects the row (onFocusCapture), which is a state update.
			act( () => input.focus() );

			fireEvent.change( input, { target: { value: 'Half-typ' } } );
			// fireEvent returns false when the handler called preventDefault:
			// the same contract TimecodeBox has a regression test for.
			expect( fireEvent.keyDown( input, { key: 'Escape' } ) ).toBe( false );

			expect( input ).toHaveValue( 'Middle' );
			expect( segments()[ 1 ] ).toHaveTextContent( 'Middle' );
			// A draft-only revert: nothing was committed, nothing to undo.
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );

			// Focus stays put, and the eventual blur commits nothing either.
			expect( input ).toHaveFocus();
			fireEvent.blur( input );
			expect( segments()[ 1 ] ).toHaveTextContent( 'Middle' );
			expect( screen.getByTestId( 'harness-can-undo' ) ).toHaveTextContent( 'false' );
		} );

		it( 'formats the row duration as a timecode rather than raw seconds', () => {
			// Real media durations are fractional, and the last row runs to the
			// video end — so this row used to read "4437.055s".
			renderChapters( { rows: [ { startAtSeconds: 0, title: 'Only' } ], durationMs: 4437055 } );

			const row = screen.getAllByTestId( /^chapters-row-chapter/ )[ 0 ];
			expect( row ).toHaveTextContent( '1:13:57.0' );
			expect( row ).not.toHaveTextContent( '4437.055s' );
		} );

		it( 'shows index, start time, and duration per row and seeks from the time button', async () => {
			const onSeek = jest.fn();
			const user = userEvent.setup();
			renderChapters( { onSeek } );

			const rows = screen.getAllByTestId( /^chapters-row-chapter/ );
			expect( rows[ 0 ] ).toHaveTextContent( '01' );
			expect( rows[ 2 ] ).toHaveTextContent( '03' );
			// Durations: next start − start; the last runs to the video end.
			expect( rows[ 0 ] ).toHaveTextContent( '0:00:10.0' );
			expect( rows[ 1 ] ).toHaveTextContent( '0:00:20.0' );
			expect( rows[ 2 ] ).toHaveTextContent( '0:00:30.0' );

			const timeButtons = screen.getAllByTestId( /^chapters-row-time-/ );
			expect( timeButtons[ 2 ] ).toHaveTextContent( '0:00:30.0' );
			await user.click( timeButtons[ 2 ] );
			expect( onSeek ).toHaveBeenCalledWith( 30000 );
		} );

		it( 're-pins the new first chapter to 0 when the first is removed', async () => {
			const user = userEvent.setup();
			renderChapters();

			await user.click( screen.getByRole( 'button', { name: 'Remove chapter 1' } ) );

			expect( segments() ).toHaveLength( 2 );
			expect( segments()[ 0 ] ).toHaveTextContent( 'Middle' );
			// Middle was re-pinned to 0: it is the first chapter now, no marker.
			expect( markers() ).toHaveLength( 1 );
			expect( screen.getAllByTestId( /^chapters-row-time-/ )[ 0 ] ).toHaveTextContent(
				'0:00:00.0'
			);
		} );

		it( 'keeps the remove button inert at a single chapter', async () => {
			const user = userEvent.setup();
			renderChapters( { rows: [ { startAtSeconds: 0, title: 'Only' } ] } );

			const remove = screen.getByRole( 'button', { name: 'Remove chapter 1' } );
			expect( isAriaDisabled( remove ) ).toBe( true );
			await user.click( remove );
			expect( segments() ).toHaveLength( 1 );
		} );

		it( 'shows the footer helptext', () => {
			renderChapters();
			expect(
				screen.getByText(
					'Chapters appear in the player timeline and help viewers jump to a section. The first chapter always starts at 0:00:00.0.'
				)
			).toBeInTheDocument();
		} );
	} );

	describe( 'toolbar', () => {
		it( 'shows the transport and the Now indicator for the chapter under the playhead', () => {
			const { rerender } = renderChapters( { currentMs: 0 } );
			expect( screen.getByTestId( 'chapters-timeline-transport-play' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'chapters-now' ) ).toHaveTextContent( 'Now: Intro' );

			rerender( { currentMs: 15000 } );
			expect( screen.getByTestId( 'chapters-now' ) ).toHaveTextContent( 'Now: Middle' );

			rerender( { currentMs: 45000 } );
			expect( screen.getByTestId( 'chapters-now' ) ).toHaveTextContent( 'Now: End' );
		} );
	} );

	describe( 'keyboard shortcuts', () => {
		it( 'removes the selected chapter with Delete, flooring at one chapter', () => {
			renderChapters();
			fireEvent.pointerDown( segments()[ 2 ], { button: 0, pointerId: 1, clientX: 600 } );

			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( segments() ).toHaveLength( 2 );

			// Nothing selected anymore: Delete is a no-op.
			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( segments() ).toHaveLength( 2 );
		} );

		it( 'toggles playback with space and seeks Home/End to the video bounds', () => {
			const onTogglePlay = jest.fn();
			const onSeek = jest.fn();
			renderChapters( { onTogglePlay, onSeek } );

			fireEvent.keyDown( document.body, { key: ' ' } );
			expect( onTogglePlay ).toHaveBeenCalledTimes( 1 );

			fireEvent.keyDown( document.body, { key: 'Home' } );
			expect( onSeek ).toHaveBeenLastCalledWith( 0 );
			fireEvent.keyDown( document.body, { key: 'End' } );
			expect( onSeek ).toHaveBeenLastCalledWith( 60000 );
		} );
	} );

	describe( 'locked (processing job or in-flight save)', () => {
		it( 'disables every control whose dispatch the host would drop, keeping the seek button live', () => {
			// currentMs 5000 is a second the add button is otherwise happy with,
			// so the lock is provably what turns it off.
			renderChapters( { locked: true, currentMs: 5000 } );

			expect( screen.getByLabelText( 'Chapter 1 title' ) ).toBeDisabled();
			expect( isAriaDisabled( screen.getByRole( 'button', { name: 'Remove chapter 1' } ) ) ).toBe(
				true
			);
			expect( isAriaDisabled( addButton() ) ).toBe( true );
			// Seeking stays allowed while locked, like the toolbar transport.
			expect( screen.getAllByTestId( /^chapters-row-time-/ )[ 0 ] ).toBeEnabled();
		} );

		it( 'reverts a title draft at the lock edge so no phantom rename survives it', () => {
			const { rerender } = renderChapters();
			const input = screen.getByLabelText( 'Chapter 1 title' );

			fireEvent.change( input, { target: { value: 'Phantom' } } );
			expect( input ).toHaveValue( 'Phantom' );

			// The host's guarded dispatch drops edits made while locked, so the
			// draft must not stay in the input looking accepted.
			rerender( { locked: true } );

			expect( input ).toHaveValue( 'Intro' );
			expect( segments()[ 0 ] ).toHaveTextContent( 'Intro' );
		} );
	} );

	describe( 'publish-rule validation', () => {
		it( 'shows nothing while the chapter set is valid', () => {
			renderChapters();
			expect( screen.queryAllByTestId( /^chapters-row-issue-/ ) ).toHaveLength( 0 );
			expect( screen.queryByTestId( 'chapters-validation' ) ).not.toBeInTheDocument();
		} );

		it( 'flags the offending row and describes its title input with the message', () => {
			renderChapters( {
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 10, title: 'Middle' },
					{ startAtSeconds: 15, title: 'End' },
				],
			} );

			const issues = screen.getAllByTestId( /^chapters-row-issue-/ );
			expect( issues ).toHaveLength( 1 );
			expect( issues[ 0 ] ).toHaveTextContent( 'Chapters must be at least 10 seconds apart.' );
			// Row 3 is the one starting less than 10s after its predecessor:
			// validateRows indexes by row POSITION, the rows are keyed by id.
			expect( screen.getAllByTestId( /^chapters-row-chapter/ )[ 2 ] ).toContainElement(
				issues[ 0 ]
			);
			expect( screen.getByLabelText( 'Chapter 3 title' ) ).toHaveAttribute(
				'aria-describedby',
				issues[ 0 ].id
			);
			// Nothing row-less to report here.
			expect( screen.queryByTestId( 'chapters-validation' ) ).not.toBeInTheDocument();
		} );

		it( 'checks the duration on the same basis the hosts use at save time', () => {
			// A fractional media duration whose rounded second is 60: rounding
			// here would clear this row while the save-time check (which gets
			// the raw seconds) warns, with no row flagged to explain it.
			renderChapters( {
				durationMs: 59600,
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 30, title: 'Middle' },
					{ startAtSeconds: 60, title: 'Past the end' },
				],
			} );

			const issues = screen.getAllByTestId( /^chapters-row-issue-/ );
			expect( issues ).toHaveLength( 1 );
			expect( issues[ 0 ] ).toHaveTextContent( 'Chapters cannot start after the video ends.' );
			expect( screen.getAllByTestId( /^chapters-row-chapter/ )[ 2 ] ).toContainElement(
				issues[ 0 ]
			);
		} );

		it( 'reports issues with no row of their own next to the footer help line', () => {
			renderChapters( {
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 30, title: 'Second' },
				],
			} );

			expect( screen.getByTestId( 'chapters-validation' ) ).toHaveTextContent(
				'At least three chapters are required.'
			);
			expect( screen.queryAllByTestId( /^chapters-row-issue-/ ) ).toHaveLength( 0 );
		} );

		// A description with no chapter lines loads as one seeded chapter, so
		// validating it would scold the user on arrival for a set they have
		// not written yet.
		it( 'stays quiet until there is more than one chapter to judge', () => {
			renderChapters( { rows: [ { startAtSeconds: 0, title: 'Only' } ] } );

			expect( screen.queryByTestId( 'chapters-validation' ) ).not.toBeInTheDocument();
			expect( screen.queryAllByTestId( /^chapters-row-issue-/ ) ).toHaveLength( 0 );
		} );

		it( 'stays quiet when an uploaded VTT governs the video', () => {
			renderChapters( {
				readOnly: true,
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 30, title: 'Second' },
				],
			} );
			expect( screen.queryByTestId( 'chapters-validation' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'read-only (manual VTT)', () => {
		it( 'keeps the strip as a visualization and replaces every edit affordance with a notice', () => {
			renderChapters( { readOnly: true, currentMs: 5000 } );

			// Segments still visualize; markers, rows, and add are gone/inert.
			expect( segments() ).toHaveLength( 3 );
			expect( markers() ).toHaveLength( 0 );
			expect( screen.queryByTestId( 'chapters-rows' ) ).not.toBeInTheDocument();
			expect( isAriaDisabled( addButton() ) ).toBe( true );
			expect( screen.getByRole( 'status' ) ).toHaveTextContent(
				'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.'
			);
		} );

		it( 'drops the Delete shortcut', () => {
			renderChapters( { readOnly: true } );
			// Selection can still happen via a segment press…
			fireEvent.pointerDown( segments()[ 2 ], { button: 0, pointerId: 1, clientX: 600 } );
			// …but Delete must not edit a manually-managed track.
			fireEvent.keyDown( document.body, { key: 'Delete' } );
			expect( segments() ).toHaveLength( 3 );
		} );
	} );
} );

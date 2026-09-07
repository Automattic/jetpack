/**
 * One draggable chapter-start marker on the Chapters tool overlay: a slim
 * accent bar in a 12px hit area, rendered for every chapter EXCEPT the
 * pinned first (which starts at 0 and never moves).
 *
 * Dragging dispatches TRANSIENT MOVE_START updates (raw ms, so the marker
 * tracks the pointer; the reducer clamps into the neighbor gap), then closes
 * the gesture with a TRANSIENT QUANTIZE — re-gridding the start to a whole
 * second, since storage is second-granular — before COMMIT folds the whole
 * drag into a single undo entry. Selection joins the gesture as a transient
 * too, so a drag also highlights its chapter without consuming history.
 *
 * The marker is a focusable `role="slider"`: aria bounds are the reducer's
 * clamp window (`prev + gap … next − gap`, last capped at `duration − gap`),
 * and arrow keys nudge by whole seconds (one undo entry each). A nudge
 * closes with the same QUANTIZE + COMMIT as a drag: the clamp ceiling
 * itself can be fractional, so a bare committed MOVE_START could land off
 * the second grid.
 */
import { sprintf, __ } from '@wordpress/i18n';
import { CHAPTER_MIN_GAP_MS } from '../state/chapters-session';
import { formatTimecode, msToPx } from '../state/time-utils';
import { useTimelinePointerDrag } from '../timeline/use-pointer-drag';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement, RefObject } from 'react';

type Props = {
	/** Position of this marker's chapter in `session.chapters` (always ≥ 1). */
	index: number;
	/** The chapters session. */
	session: ChaptersSession;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
	/** The timeline's scaled content element, for pointer→ms math. */
	contentRef: RefObject< HTMLElement | null >;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
};

/**
 * A chapter-start marker.
 *
 * @param props            - Component props.
 * @param props.index      - Position of the chapter in the session (≥ 1).
 * @param props.session    - The chapters session.
 * @param props.pxPerMs    - Scale from `getPxPerMs`.
 * @param props.contentRef - The timeline's scaled content element.
 * @param props.dispatch   - Dispatch into the history-wrapped reducer.
 * @return The marker element.
 */
export default function ChapterMarker( {
	index,
	session,
	pxPerMs,
	contentRef,
	dispatch,
}: Props ): ReactElement {
	const chapter = session.chapters[ index ];
	const minMs = session.chapters[ index - 1 ].startMs + CHAPTER_MIN_GAP_MS;
	const maxMs =
		index === session.chapters.length - 1
			? session.durationMs - CHAPTER_MIN_GAP_MS
			: session.chapters[ index + 1 ].startMs - CHAPTER_MIN_GAP_MS;

	const drag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => chapter.startMs,
		// Selection joins the gesture as a transient, so COMMIT folds the
		// select + every move into a single undo entry.
		onDragStart: () =>
			dispatch( { type: 'TRANSIENT', action: { type: 'SELECT', id: chapter.id } } ),
		onDragMove: ms =>
			dispatch( {
				type: 'TRANSIENT',
				action: { type: 'MOVE_START', id: chapter.id, startMs: ms },
			} ),
		onDragEnd: () => {
			// Close the gesture on the second grid, THEN commit: committed
			// sessions are always whole-second (storage is `H:MM:SS` lines).
			dispatch( { type: 'TRANSIENT', action: { type: 'QUANTIZE' } } );
			dispatch( { type: 'COMMIT' } );
		},
	} );

	const onKeyDown = ( event: ReactKeyboardEvent< HTMLElement > ) => {
		let delta: number;
		if ( event.key === 'ArrowLeft' ) {
			delta = -1000;
		} else if ( event.key === 'ArrowRight' ) {
			delta = 1000;
		} else {
			return;
		}
		// Handled here; keep the document-level shortcuts from also nudging.
		event.preventDefault();
		event.stopPropagation();
		// A nudge is a one-step gesture and must close exactly like a drag:
		// MOVE_START clamps against bounds that can be fractional (the last
		// chapter's ceiling is `duration − gap`), so committing it bare could
		// record a raw-ms start — the invariant QUANTIZE exists to protect.
		// The transient + QUANTIZE + COMMIT sequence re-grids the landing spot
		// and still folds into a single undo entry; a nudge that quantizes
		// back to its own start commits nothing.
		dispatch( {
			type: 'TRANSIENT',
			action: { type: 'MOVE_START', id: chapter.id, startMs: chapter.startMs + delta },
		} );
		dispatch( { type: 'TRANSIENT', action: { type: 'QUANTIZE' } } );
		dispatch( { type: 'COMMIT' } );
	};

	return (
		<div
			className="vp-chapters__marker"
			data-testid={ `chapters-marker-${ chapter.id }` }
			role="slider"
			tabIndex={ 0 }
			aria-label={ sprintf(
				/* translators: %s: chapter title. */
				__( 'Chapter start: %s', 'jetpack-videopress-pkg' ),
				chapter.title
			) }
			aria-orientation="horizontal"
			aria-valuemin={ minMs }
			aria-valuemax={ maxMs }
			aria-valuenow={ chapter.startMs }
			aria-valuetext={ formatTimecode( chapter.startMs ) }
			style={ { left: `${ msToPx( chapter.startMs, pxPerMs ) }px` } }
			onKeyDown={ onKeyDown }
			onPointerDown={ event => {
				// A marker grab must not also start a scrub on the surface
				// underneath (the shell still sees the gesture in its capture
				// phase, which is what suppresses auto-follow during drags).
				event.stopPropagation();
				drag.onPointerDown( event );
			} }
			onPointerMove={ drag.onPointerMove }
			onPointerUp={ drag.onPointerUp }
			onPointerCancel={ drag.onPointerCancel }
		/>
	);
}

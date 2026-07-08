/**
 * One cut range on the edit overlay: a striped segment with an edge-drag
 * handle on each side and a remove (✕) affordance.
 *
 * Dragging the BODY moves the whole cut (width-preserving MOVE_CUT, snapped
 * on whichever candidate edge lands closest to a target); dragging an EDGE
 * resizes it (UPDATE_CUT). Both gestures select the cut as a transient and
 * dispatch TRANSIENT moves with a COMMIT on release, so a whole drag is one
 * undo entry — and a body click that never moves just selects, without
 * consuming one. Snapping targets the playhead, the trim edges, and other
 * cuts' edges — not the cut's own edges, which would make small cuts sticky
 * against themselves. Edge handles are focusable `role="slider"` elements
 * with arrow-key nudging (±100ms, ±1s with Shift).
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { useRef } from 'react';
import { formatTimecode, msToPx, snapMoveMs, snapMs } from '../state/time-utils';
import { NUDGE_LARGE_MS, NUDGE_MS } from './use-keyboard-shortcuts';
import { useTimelinePointerDrag } from './use-pointer-drag';
import type { CutRange, EditSession, EditSessionAction } from '../state/edit-session';
import type { HistoryAction } from '../state/history';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement, RefObject } from 'react';

type Props = {
	/** The cut this segment renders. */
	cut: CutRange;
	/** The edit session (bounds, sibling cuts, selection). */
	session: EditSession;
	/** Live playhead position in master-timeline ms (snap target). */
	currentMs: number;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
	/** The timeline's scaled content element, for pointer→ms math. */
	contentRef: RefObject< HTMLElement | null >;
	/** Dispatch into the history-wrapped session reducer. */
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
};

type Edge = 'start' | 'end';

/**
 * The snap context shared by the edge and body drags: the trim edges, the
 * playhead, and every OTHER cut's edges (never the dragged cut's own).
 *
 * @param session   - The edit session.
 * @param cut       - The cut being dragged.
 * @param currentMs - Live playhead position in ms.
 * @param pxPerMs   - Scale from `getPxPerMs`.
 * @return A context for {@link snapMs} / {@link snapMoveMs}.
 */
function cutSnapContext( session: EditSession, cut: CutRange, currentMs: number, pxPerMs: number ) {
	return {
		pxPerMs,
		durationMs: session.durationMs,
		playheadMs: currentMs,
		edgesMs: [
			session.trimStartMs,
			session.trimEndMs,
			...session.cuts
				.filter( other => other.id !== cut.id )
				.flatMap( other => [ other.startMs, other.endMs ] ),
		],
	};
}

/**
 * One draggable cut edge.
 *
 * @param props      - The parent segment's props plus the edge to move.
 * @param props.edge - Which cut edge this handle moves.
 * @return The edge-handle element.
 */
function StudioEditorCutEdge( { edge, ...props }: Props & { edge: Edge } ): ReactElement {
	const { cut, session, currentMs, pxPerMs, contentRef, dispatch } = props;
	const valueMs = edge === 'start' ? cut.startMs : cut.endMs;

	const moveAction = ( ms: number ): EditSessionAction =>
		edge === 'start'
			? { type: 'UPDATE_CUT', id: cut.id, startMs: ms }
			: { type: 'UPDATE_CUT', id: cut.id, endMs: ms };

	const snapEdge = ( ms: number ) =>
		snapMs( ms, cutSnapContext( session, cut, currentMs, pxPerMs ) );

	const drag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => valueMs,
		// Selection joins the gesture as a transient, so COMMIT folds the
		// select + every move into a single undo entry.
		onDragStart: () =>
			dispatch( { type: 'TRANSIENT', action: { type: 'SELECT_CUT', id: cut.id } } ),
		onDragMove: ms => dispatch( { type: 'TRANSIENT', action: moveAction( snapEdge( ms ) ) } ),
		onDragEnd: () => dispatch( { type: 'COMMIT' } ),
	} );

	const onKeyDown = ( event: ReactKeyboardEvent< HTMLElement > ) => {
		let delta: number;
		if ( event.key === 'ArrowLeft' ) {
			delta = event.shiftKey ? -NUDGE_LARGE_MS : -NUDGE_MS;
		} else if ( event.key === 'ArrowRight' ) {
			delta = event.shiftKey ? NUDGE_LARGE_MS : NUDGE_MS;
		} else {
			return;
		}
		// Handled here; keep the document-level shortcuts from also nudging.
		event.preventDefault();
		event.stopPropagation();
		dispatch( moveAction( valueMs + delta ) );
	};

	return (
		<div
			className={ `vp-studio-timeline__cut-edge vp-studio-timeline__cut-edge--${ edge }` }
			data-testid={ `studio-timeline-cut-${ edge }-${ cut.id }` }
			role="slider"
			tabIndex={ 0 }
			aria-label={
				edge === 'start'
					? __( 'Cut start', 'jetpack-videopress-pkg' )
					: __( 'Cut end', 'jetpack-videopress-pkg' )
			}
			aria-orientation="horizontal"
			aria-valuemin={ edge === 'start' ? session.trimStartMs : cut.startMs }
			aria-valuemax={ edge === 'start' ? cut.endMs : session.trimEndMs }
			aria-valuenow={ valueMs }
			aria-valuetext={ formatTimecode( valueMs ) }
			onKeyDown={ onKeyDown }
			onPointerDown={ event => {
				// Neither a body-select nor a surface scrub should also start.
				event.stopPropagation();
				drag.onPointerDown( event );
			} }
			onPointerMove={ drag.onPointerMove }
			onPointerUp={ drag.onPointerUp }
			onPointerCancel={ drag.onPointerCancel }
		/>
	);
}

/**
 * A cut segment: striped draggable body, two edge handles, remove button.
 *
 * @param props - Component props (see the Props type).
 * @return The segment element.
 */
export default function StudioEditorCutSegment( props: Props ): ReactElement {
	const { cut, session, currentMs, pxPerMs, contentRef, dispatch } = props;
	const selected = session.selectedCutId === cut.id;
	const leftPx = msToPx( cut.startMs, pxPerMs );
	const widthPx = msToPx( cut.endMs - cut.startMs, pxPerMs );

	// The cut's start when the body grab began. A drag position equal to it
	// means the pointer has not moved the cut; snapping is skipped there so a
	// plain click can never nudge a cut toward a nearby target.
	const grabStartMsRef = useRef( 0 );

	const bodyDrag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => cut.startMs,
		// Selection joins the gesture as a transient, so COMMIT folds the
		// select + every move into a single undo entry — and a click that
		// never moves selects without consuming one (selection alone is not
		// history-relevant to the wrapper's equality).
		onDragStart: () => {
			grabStartMsRef.current = cut.startMs;
			dispatch( { type: 'TRANSIENT', action: { type: 'SELECT_CUT', id: cut.id } } );
		},
		onDragMove: ms => {
			const startMs =
				ms === grabStartMsRef.current
					? ms
					: snapMoveMs(
							ms,
							cut.endMs - cut.startMs,
							cutSnapContext( session, cut, currentMs, pxPerMs )
					  );
			dispatch( { type: 'TRANSIENT', action: { type: 'MOVE_CUT', id: cut.id, startMs } } );
		},
		onDragEnd: () => dispatch( { type: 'COMMIT' } ),
	} );

	const classes = [ 'vp-studio-timeline__cut', selected ? 'vp-studio-timeline__cut--selected' : '' ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			className={ classes }
			data-testid={ `studio-timeline-cut-${ cut.id }` }
			style={ { left: `${ leftPx }px`, width: `${ widthPx }px` } }
			onPointerDown={ event => {
				// A body grab must not also start a scrub on the surface
				// underneath (the shell still sees the gesture in its capture
				// phase, which is what suppresses auto-follow during drags).
				event.stopPropagation();
				bodyDrag.onPointerDown( event );
			} }
			onPointerMove={ bodyDrag.onPointerMove }
			onPointerUp={ bodyDrag.onPointerUp }
			onPointerCancel={ bodyDrag.onPointerCancel }
		>
			<StudioEditorCutEdge edge="start" { ...props } />
			<Button
				className="vp-studio-timeline__cut-remove"
				size="small"
				icon={ <Icon icon={ closeSmall } size={ 16 } /> }
				label={ __( 'Remove cut', 'jetpack-videopress-pkg' ) }
				// Keep the press from also selecting the cut it is about to
				// remove (a pointless selection flash before the removal).
				onPointerDown={ event => event.stopPropagation() }
				onClick={ () => dispatch( { type: 'REMOVE_CUT', id: cut.id } ) }
			/>
			<StudioEditorCutEdge edge="end" { ...props } />
		</div>
	);
}

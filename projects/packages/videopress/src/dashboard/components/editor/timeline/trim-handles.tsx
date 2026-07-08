/**
 * Trim window UI for the edit overlay: dimmed shrouds outside the kept range
 * and a blue drag handle at each end.
 *
 * Dragging dispatches TRANSIENT SET_TRIM_START/END on every move and COMMIT
 * on release, so a whole gesture is one undo entry. Handle positions come
 * from the session (the reducer clamps against the minimum-output rule), and
 * every move also seeks the preview to the handle's resulting time — YouTube
 * behavior, so the user sees the exact frame they are trimming to. Snapping
 * targets the other trim edge and cut edges but NOT the playhead, which
 * follows the handle during the drag and would otherwise snap it to its own
 * previous position.
 *
 * Handles are focusable `role="slider"` elements; arrow keys nudge ±100ms
 * (±1s with Shift) as plain actions (one undo entry per press).
 */
import { __ } from '@wordpress/i18n';
import { editSessionReducer } from '../state/edit-session';
import { formatTimecode, msToPx, snapMs } from '../state/time-utils';
import { NUDGE_LARGE_MS, NUDGE_MS } from './use-keyboard-shortcuts';
import { useTimelinePointerDrag } from './use-pointer-drag';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { HistoryAction } from '../state/history';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement, RefObject } from 'react';

type Props = {
	/** The edit session (trim window, cuts, duration). */
	session: EditSession;
	/** Scale from `getPxPerMs`. */
	pxPerMs: number;
	/** The timeline's scaled content element, for pointer→ms math. */
	contentRef: RefObject< HTMLElement | null >;
	/** Dispatch into the history-wrapped session reducer. */
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
};

type Edge = 'start' | 'end';

/**
 * One trim handle (start or end edge of the kept window).
 *
 * @param props            - Component props.
 * @param props.edge       - Which trim edge this handle moves.
 * @param props.session    - The edit session.
 * @param props.pxPerMs    - Scale from `getPxPerMs`.
 * @param props.contentRef - The timeline's scaled content element.
 * @param props.dispatch   - Dispatch into the history-wrapped reducer.
 * @param props.onSeek     - Seek the preview player.
 * @return The handle element.
 */
function StudioEditorTrimHandle( {
	edge,
	session,
	pxPerMs,
	contentRef,
	dispatch,
	onSeek,
}: Props & {
	edge: Edge;
} ): ReactElement {
	const valueMs = edge === 'start' ? session.trimStartMs : session.trimEndMs;
	const actionType = edge === 'start' ? 'SET_TRIM_START' : 'SET_TRIM_END';

	// The trimmed edge from the resulting session, so seeks reflect the
	// reducer's clamping (minimum output, window bounds) exactly.
	const applyMove = ( ms: number, transient: boolean ) => {
		const action: EditSessionAction = { type: actionType, ms };
		dispatch( transient ? { type: 'TRANSIENT', action } : action );
		const next = editSessionReducer( session, action );
		onSeek( edge === 'start' ? next.trimStartMs : next.trimEndMs );
	};

	const drag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => valueMs,
		onDragMove: ms => {
			const snapped = snapMs( ms, {
				pxPerMs,
				durationMs: session.durationMs,
				edgesMs: [
					edge === 'start' ? session.trimEndMs : session.trimStartMs,
					...session.cuts.flatMap( cut => [ cut.startMs, cut.endMs ] ),
				],
			} );
			applyMove( snapped, true );
		},
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
		applyMove( valueMs + delta, false );
	};

	return (
		<div
			className={ `vp-studio-timeline__trim-handle vp-studio-timeline__trim-handle--${ edge }` }
			data-testid={ `studio-timeline-trim-${ edge }` }
			role="slider"
			tabIndex={ 0 }
			aria-label={
				edge === 'start'
					? __( 'Trim start', 'jetpack-videopress-pkg' )
					: __( 'Trim end', 'jetpack-videopress-pkg' )
			}
			aria-orientation="horizontal"
			aria-valuemin={ edge === 'start' ? 0 : session.trimStartMs }
			aria-valuemax={ edge === 'start' ? session.trimEndMs : session.durationMs }
			aria-valuenow={ valueMs }
			aria-valuetext={ formatTimecode( valueMs ) }
			style={ { transform: `translateX(${ msToPx( valueMs, pxPerMs ) }px)` } }
			onKeyDown={ onKeyDown }
			onPointerDown={ event => {
				// A grabbed handle must not also start a scrub on the surface.
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
 * Both trim handles plus the dimmed shrouds outside the trim window.
 *
 * @param props            - Component props.
 * @param props.session    - The edit session.
 * @param props.pxPerMs    - Scale from `getPxPerMs`.
 * @param props.contentRef - The timeline's scaled content element.
 * @param props.dispatch   - Dispatch into the history-wrapped reducer.
 * @param props.onSeek     - Seek the preview player.
 * @return The trim UI fragment.
 */
export default function StudioEditorTrimHandles( props: Props ): ReactElement {
	const { session, pxPerMs } = props;
	const startPx = msToPx( session.trimStartMs, pxPerMs );
	const endPx = msToPx( session.trimEndMs, pxPerMs );
	const durationPx = msToPx( session.durationMs, pxPerMs );

	return (
		<>
			{ startPx > 0 && (
				<div
					className="vp-studio-timeline__shroud"
					data-testid="studio-timeline-shroud-start"
					style={ { left: 0, width: `${ startPx }px` } }
				/>
			) }
			{ durationPx > endPx && (
				<div
					className="vp-studio-timeline__shroud"
					data-testid="studio-timeline-shroud-end"
					style={ { left: `${ endPx }px`, width: `${ durationPx - endPx }px` } }
				/>
			) }
			<StudioEditorTrimHandle edge="start" { ...props } />
			<StudioEditorTrimHandle edge="end" { ...props } />
		</>
	);
}

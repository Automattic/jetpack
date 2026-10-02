/**
 * Trim window UI for the edit overlay: dimmed shrouds outside the kept range and a blue drag
 * handle at each end.
 */
import { __ } from '@wordpress/i18n';
import { useRef } from 'react';
import {
	formatTimecode,
	msToPx,
} from '../../../../client/components/chapters-editor/state/time-utils';
import {
	NUDGE_LARGE_MS,
	NUDGE_MS,
} from '../../../../client/components/chapters-editor/timeline/use-keyboard-shortcuts';
import { useTimelinePointerDrag } from '../../../../client/components/chapters-editor/timeline/use-pointer-drag';
import { editSessionReducer } from '../state/edit-session';
import { snapMs } from './snap';
import type { HistoryAction } from '../../../../client/components/chapters-editor/state/history';
import type { EditSession, EditSessionAction } from '../state/edit-session';
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
	const grabSession = useRef( session );

	// The trimmed edge from the resulting session, so seeks reflect the
	// reducer's clamping (minimum output, window bounds) exactly.
	const applyMove = ( ms: number, transient: boolean ) => {
		const action: EditSessionAction = { type: actionType, ms };
		dispatch( transient ? { type: 'TRANSIENT', action, fromBase: true } : action );
		const next = editSessionReducer( transient ? grabSession.current : session, action );
		onSeek( edge === 'start' ? next.trimStartMs : next.trimEndMs );
	};

	const drag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => valueMs,
		onDragStart: () => {
			grabSession.current = session;
		},
		onDragMove: ms => {
			const snapped = snapMs( ms, {
				pxPerMs,
				durationMs: session.durationMs,
				edgesMs: [
					edge === 'start' ? grabSession.current.trimEndMs : grabSession.current.trimStartMs,
					...grabSession.current.cuts.flatMap( cut => [ cut.startMs, cut.endMs ] ),
				],
			} );
			applyMove(
				ms ===
					( edge === 'start' ? grabSession.current.trimStartMs : grabSession.current.trimEndMs )
					? ms
					: snapped,
				true
			);
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
			style={ {
				transform: `translateX(${ Math.max( 0, Math.min( msToPx( session.durationMs, pxPerMs ) - 10, msToPx( valueMs, pxPerMs ) - 5 ) ) }px)`,
			} }
			onKeyDown={ onKeyDown }
			onPointerDown={ event => {
				// A grabbed handle must not also start a scrub on the surface.
				event.stopPropagation();
				if ( event.button === 0 ) {
					event.currentTarget.focus();
				}
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
					style={ { insetInlineStart: 0, inlineSize: `${ startPx }px` } }
				/>
			) }
			{ durationPx > endPx && (
				<div
					className="vp-studio-timeline__shroud"
					data-testid="studio-timeline-shroud-end"
					style={ { insetInlineStart: `${ endPx }px`, inlineSize: `${ durationPx - endPx }px` } }
				/>
			) }
			<StudioEditorTrimHandle edge="start" { ...props } />
			<StudioEditorTrimHandle edge="end" { ...props } />
		</>
	);
}

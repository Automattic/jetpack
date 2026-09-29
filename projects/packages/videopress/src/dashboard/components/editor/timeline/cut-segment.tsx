/**
 * One cut range on the edit overlay: a striped segment with an edge-drag handle on each side and
 * a remove (✕) affordance.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
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
import { snapMoveMs, snapMs } from './snap';
import type { HistoryAction } from '../../../../client/components/chapters-editor/state/history';
import type { CutRange, EditSession, EditSessionAction } from '../state/edit-session';
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
 * The snap edges shared by the edge and body drags: the trim edges and every OTHER cut's edges
 * (never the dragged cut's own).
 *
 * @param session - The edit session.
 * @param cut     - The cut being dragged.
 * @return Edge positions in ms, for a {@link snapMs} / {@link snapMoveMs} context.
 */
function cutSnapEdges( session: EditSession, cut: CutRange ): number[] {
	return [
		session.trimStartMs,
		session.trimEndMs,
		...session.cuts
			.filter( other => other.id !== cut.id )
			.flatMap( other => [ other.startMs, other.endMs ] ),
	];
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
	const grabRef = useRef( { valueMs, edgesMs: cutSnapEdges( session, cut ) } );

	const moveAction = ( ms: number ): EditSessionAction =>
		edge === 'start'
			? { type: 'UPDATE_CUT', id: cut.id, startMs: ms }
			: { type: 'UPDATE_CUT', id: cut.id, endMs: ms };

	const snapEdge = ( ms: number ) =>
		snapMs( ms, {
			pxPerMs,
			durationMs: session.durationMs,
			playheadMs: currentMs,
			edgesMs: grabRef.current.edgesMs,
		} );

	const drag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => valueMs,
		// Selection joins the gesture as a transient, so COMMIT folds the
		// select + every move into a single undo entry.
		onDragStart: () => {
			grabRef.current = { valueMs, edgesMs: cutSnapEdges( session, cut ) };
			dispatch( { type: 'TRANSIENT', action: { type: 'SELECT_CUT', id: cut.id } } );
		},
		onDragMove: ms =>
			dispatch( {
				type: 'TRANSIENT',
				fromBase: true,
				action: moveAction( ms === grabRef.current.valueMs ? ms : snapEdge( ms ) ),
			} ),
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

	// Keep snap inputs stable while transient merges change the displayed ranges.
	const grabRef = useRef( { startMs: 0, widthMs: 0, edgesMs: [] as number[] } );

	const bodyDrag = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		getAnchorMs: () => cut.startMs,
		onDragStart: () => {
			grabRef.current = {
				startMs: cut.startMs,
				widthMs: cut.endMs - cut.startMs,
				edgesMs: cutSnapEdges( session, cut ),
			};
			dispatch( { type: 'TRANSIENT', action: { type: 'SELECT_CUT', id: cut.id } } );
		},
		onDragMove: ms => {
			const { startMs: grabStartMs, widthMs, edgesMs } = grabRef.current;
			const startMs =
				ms === grabStartMs
					? ms
					: snapMoveMs( ms, widthMs, {
							pxPerMs,
							durationMs: session.durationMs,
							playheadMs: currentMs,
							edgesMs,
						} );
			dispatch( {
				type: 'TRANSIENT',
				fromBase: true,
				action: { type: 'MOVE_CUT', id: cut.id, startMs },
			} );
		},
		onDragEnd: () => dispatch( { type: 'COMMIT' } ),
	} );

	const classes = [ 'vp-studio-timeline__cut', selected ? 'vp-studio-timeline__cut--selected' : '' ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			className={ classes }
			role="group"
			tabIndex={ 0 }
			aria-label={ __( 'Cut', 'jetpack-videopress-pkg' ) }
			data-testid={ `studio-timeline-cut-${ cut.id }` }
			style={ { insetInlineStart: `${ leftPx }px`, inlineSize: `${ widthPx }px` } }
			onPointerDown={ event => {
				event.stopPropagation();
				if ( event.button === 0 ) {
					event.currentTarget.focus();
				}
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

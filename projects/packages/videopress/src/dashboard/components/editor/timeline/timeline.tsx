import { useCallback } from 'react';
import StudioEditorTimeRuler from '../../../../client/components/chapters-editor/timeline/time-ruler';
import StudioTimelineShell, {
	clampToDuration,
} from '../../../../client/components/chapters-editor/timeline/timeline-shell';
import { useKeyboardShortcuts } from '../../../../client/components/chapters-editor/timeline/use-keyboard-shortcuts';
import { getFilmstripZoomLadder } from '../../../../client/components/chapters-editor/timeline/zoom-ladder';
import { getOutputDurationMs, MIN_OUTPUT_MS } from '../state/edit-session';
import StudioEditorEditOverlay from './edit-overlay';
import StudioEditorFilmstripTrack from './filmstrip-track';
import StudioEditorTimelineToolbar from './toolbar';
import './style.scss';
import type { HistoryAction } from '../../../../client/components/chapters-editor/state/history';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { ReactElement } from 'react';

export type StudioEditorTimelineProps = {
	session: EditSession;
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
	currentMs: number;
	onSeek: ( ms: number ) => void;
	onTogglePlay: () => void;
	playing: boolean;
	locked?: boolean;
	onScrubStart?: () => void;
	onScrubEnd?: () => void;
	shortcutsEnabled?: boolean;
	filmstrip?: FilmstripState;
};

/**
 * Compose trim controls over the shared timeline surface.
 *
 * @param props                  - Editor state, transport callbacks, and storyboard.
 * @param props.session          - The current edits.
 * @param props.dispatch         - Dispatch an edit or history action.
 * @param props.currentMs        - Playhead position in milliseconds.
 * @param props.onSeek           - Seek to a master timestamp.
 * @param props.onTogglePlay     - Toggle preview playback.
 * @param props.playing          - Whether the preview is playing.
 * @param props.locked           - Whether editing is locked during processing.
 * @param props.onScrubStart     - Pause playback for a pointer gesture.
 * @param props.onScrubEnd       - Finish a pointer gesture.
 * @param props.shortcutsEnabled - Whether document shortcuts are enabled.
 * @param props.filmstrip        - Original-video storyboard state.
 * @return The trim and cut timeline.
 */
export default function StudioEditorTimeline( {
	session,
	dispatch: dispatchAction,
	currentMs,
	onSeek,
	onTogglePlay,
	playing,
	locked = false,
	onScrubStart,
	onScrubEnd,
	shortcutsEnabled = true,
	filmstrip,
}: StudioEditorTimelineProps ): ReactElement {
	const durationMs = session.durationMs;
	const dispatch = useCallback(
		( action: HistoryAction< EditSessionAction > ) => {
			if ( ! locked ) {
				dispatchAction( action );
			}
		},
		[ dispatchAction, locked ]
	);

	const seekClamped = useCallback(
		( ms: number ) => onSeek( clampToDuration( ms, durationMs ) ),
		[ onSeek, durationMs ]
	);

	// A scrub also deselects the selected cut — clicking empty strip both
	// moves the playhead and clears the selection, like any canvas app.
	const handleScrubStart = useCallback( () => {
		onScrubStart?.();
		if ( session.selectedCutId !== null ) {
			dispatch( { type: 'SELECT_CUT', id: null } );
		}
	}, [ onScrubStart, session.selectedCutId, dispatch ] );

	useKeyboardShortcuts( {
		enabled: shortcutsEnabled,
		onTogglePlay,
		onNudge: delta => seekClamped( currentMs + delta ),
		onHome: () => onSeek( session.trimStartMs ),
		onEnd: () => onSeek( session.trimEndMs ),
		onRemoveSelected: () => {
			if ( session.selectedCutId !== null ) {
				dispatch( { type: 'REMOVE_CUT', id: session.selectedCutId } );
			}
		},
		onUndo: () => dispatch( { type: 'UNDO' } ),
		onRedo: () => dispatch( { type: 'REDO' } ),
	} );

	return (
		<div className="vp-trim-cut-timeline">
			<StudioTimelineShell
				durationMs={ durationMs }
				currentMs={ currentMs }
				playing={ playing }
				locked={ locked }
				getZoomLadder={ viewportWidth => getFilmstripZoomLadder( durationMs, viewportWidth ) }
				onSeek={ onSeek }
				onScrubStart={ handleScrubStart }
				onScrubEnd={ onScrubEnd }
				toolbar={ ( { zoom, zoomLadder, applyZoom } ) => (
					<StudioEditorTimelineToolbar
						locked={ locked }
						playing={ playing }
						onTogglePlay={ onTogglePlay }
						currentMs={ currentMs }
						durationMs={ durationMs }
						canAddCut={
							! locked &&
							currentMs >= session.trimStartMs &&
							currentMs <= session.trimEndMs &&
							getOutputDurationMs( session ) > MIN_OUTPUT_MS
						}
						onAddCut={ () => dispatch( { type: 'ADD_CUT', atMs: currentMs } ) }
						selectedCut={ session.cuts.find( cut => cut.id === session.selectedCutId ) ?? null }
						onRemoveCut={ id => ! locked && dispatch( { type: 'REMOVE_CUT', id } ) }
						onSeek={ seekClamped }
						zoom={ zoom }
						zoomLadder={ zoomLadder }
						onZoomChange={ applyZoom }
						onFit={ () => applyZoom( 1 ) }
					/>
				) }
				tracks={ ( { pxPerMs, contentWidth } ) => [
					{
						id: 'ruler',
						element: <StudioEditorTimeRuler durationMs={ durationMs } pxPerMs={ pxPerMs } />,
					},
					{
						id: 'filmstrip',
						element: (
							<StudioEditorFilmstripTrack
								filmstrip={ filmstrip }
								trackWidth={ contentWidth }
								durationMs={ durationMs }
							/>
						),
					},
				] }
				overlay={ ( { pxPerMs, contentRef } ) => (
					<StudioEditorEditOverlay
						onGestureStart={ onScrubStart }
						onGestureEnd={ onScrubEnd }
						session={ session }
						currentMs={ currentMs }
						pxPerMs={ pxPerMs }
						contentRef={ contentRef }
						dispatch={ dispatch }
						onSeek={ seekClamped }
					/>
				) }
			/>
		</div>
	);
}

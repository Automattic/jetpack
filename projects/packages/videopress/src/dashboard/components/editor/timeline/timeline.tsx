/**
 * The Studio editor timeline for the trim & cut tool: the shared
 * {@link StudioTimelineShell} (toolbar slot, scaled scrub surface, playhead)
 * composed with the tool's tracks (time ruler + filmstrip) and its edit
 * overlay (trim handles, shrouds, cut segments).
 *
 * This module owns everything trim/cut-specific: the toolbar's transport and
 * "New cut" wiring, the session-aware scrub start (a scrub deselects the
 * selected cut), and the document-level shortcuts (space, arrows, Home/End,
 * Delete, mod+Z) that attach while the timeline is mounted. Geometry — zoom,
 * the one shared horizontal scale, wheel handling — lives in the shell's
 * useTimelineGeometry hook; the zoom cap is the filmstrip's native tile
 * density (getFilmstripZoomMax), so tiles can never be upscaled.
 */
import { useCallback } from 'react';
import StudioEditorEditOverlay from './edit-overlay';
import StudioEditorFilmstripTrack, { getFilmstripZoomMax } from './filmstrip-track';
import StudioEditorTimeRuler from './time-ruler';
import StudioTimelineShell, { clampToDuration } from './timeline-shell';
import StudioEditorTimelineToolbar from './toolbar';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import './style.scss';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

export type StudioEditorTimelineProps = {
	/** The edit session. */
	session: EditSession;
	/** Dispatch into the history-wrapped session reducer. */
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
	/** Toggle preview playback (toolbar transport button, space bar). */
	onTogglePlay: () => void;
	/** Whether preview playback is running (toolbar transport icon). */
	playing: boolean;
	/**
	 * True while a processing job locks editing. Only the strip's scroller
	 * region blocks pointer interaction (the toolbar's transport and zoom
	 * stay usable); the parent's guarded dispatch drops edit dispatches
	 * either way, and it also owns the aria-busy announcement.
	 */
	locked?: boolean;
	/**
	 * A scrub gesture started (pointer-down on empty track area). The parent
	 * pauses playback here so per-move seeks don't fight the playback
	 * resolver's own corrective seeks.
	 */
	onScrubStart?: () => void;
	/** The scrub gesture ended (pointer-up/cancel). */
	onScrubEnd?: () => void;
	/**
	 * False detaches the document-level keyboard shortcuts (e.g. while a
	 * confirm dialog is open, so Space activates the focused dialog button
	 * instead of toggling playback behind it). Defaults to true.
	 */
	shortcutsEnabled?: boolean;
	/** Filmstrip data for the strip track; absent renders the placeholder. */
	filmstrip?: FilmstripState;
};

/**
 * The trim & cut timeline.
 *
 * @param props                  - Component props.
 * @param props.session          - The edit session.
 * @param props.dispatch         - Dispatch into the history-wrapped reducer.
 * @param props.currentMs        - Live playhead position in ms.
 * @param props.onSeek           - Seek the preview player.
 * @param props.onTogglePlay     - Toggle preview playback.
 * @param props.playing          - Whether preview playback is running.
 * @param props.locked           - Whether a processing job locks the strip.
 * @param props.onScrubStart     - A scrub gesture started.
 * @param props.onScrubEnd       - The scrub gesture ended.
 * @param props.shortcutsEnabled - Whether the document-level shortcuts attach.
 * @param props.filmstrip        - Filmstrip data for the strip track.
 * @return The timeline element.
 */
export default function StudioEditorTimeline( {
	session,
	dispatch,
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
		onRemoveSelectedCut: () => {
			if ( session.selectedCutId !== null ) {
				dispatch( { type: 'REMOVE_CUT', id: session.selectedCutId } );
			}
		},
		onUndo: () => dispatch( { type: 'UNDO' } ),
		onRedo: () => dispatch( { type: 'REDO' } ),
	} );

	return (
		<StudioTimelineShell
			durationMs={ durationMs }
			currentMs={ currentMs }
			playing={ playing }
			locked={ locked }
			getZoomMax={ viewportWidth => getFilmstripZoomMax( filmstrip, durationMs, viewportWidth ) }
			onSeek={ onSeek }
			onScrubStart={ handleScrubStart }
			onScrubEnd={ onScrubEnd }
			toolbar={ ( { zoom, zoomMax, applyZoom } ) => (
				<StudioEditorTimelineToolbar
					playing={ playing }
					onTogglePlay={ onTogglePlay }
					currentMs={ currentMs }
					durationMs={ durationMs }
					canAddCut={ currentMs >= session.trimStartMs && currentMs <= session.trimEndMs }
					onAddCut={ () => dispatch( { type: 'ADD_CUT', atMs: currentMs } ) }
					onSeek={ seekClamped }
					zoom={ zoom }
					zoomMax={ zoomMax }
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
					session={ session }
					currentMs={ currentMs }
					pxPerMs={ pxPerMs }
					contentRef={ contentRef }
					dispatch={ dispatch }
					onSeek={ seekClamped }
				/>
			) }
		/>
	);
}

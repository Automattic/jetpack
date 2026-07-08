/**
 * The Studio editor timeline for the Chapters tool: the shared
 * {@link StudioTimelineShell} (toolbar slot, scaled scrub surface, gridlines,
 * playhead) composed with the chapter-segments track, the draggable
 * chapter-start markers, and the rows list below the strip.
 *
 * This module owns everything chapters-specific: the toolbar's
 * "Add chapter at playhead" wiring (inert per the reducer's ADD_AT no-op
 * predicate), the "Now: {chapter}" indicator, and the document-level
 * shortcuts instance that attaches while THIS tool is mounted (space,
 * arrows, Home/End to the video bounds, Delete removes the selected chapter
 * — the reducer floors removal at one). The zoom ceiling is the SAME
 * filmstrip cap as the trim tool ({@link getFilmstripZoomMax}) even though
 * this strip draws no tiles, so both tools share one four-stop zoom ladder
 * and switching tools never re-scales the strip.
 *
 * `readOnly` (a manually uploaded chapters VTT exists) keeps the strip as a
 * visualization — segments render, the playhead scrubs — but removes every
 * edit affordance: no markers, the add button is disabled, and the rows list
 * is replaced by a notice.
 */
import { Button } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { canAddChapterAt } from '../state/chapters-session';
import { getFilmstripZoomMax } from '../timeline/filmstrip-track';
import StudioEditorTimeRuler from '../timeline/time-ruler';
import StudioTimelineShell, { clampToDuration } from '../timeline/timeline-shell';
import StudioTimelineTransport from '../timeline/transport';
import { useKeyboardShortcuts } from '../timeline/use-keyboard-shortcuts';
import StudioEditorZoomControl from '../timeline/zoom-control';
import StudioChapterMarker from './chapter-marker';
import StudioChapterRows from './chapter-rows';
import StudioChapterTrack from './chapter-track';
import './style.scss';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

export type StudioChaptersTimelineProps = {
	/** The chapters session. */
	session: ChaptersSession;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
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
	/** A scrub gesture started (pointer-down on empty track area). */
	onScrubStart?: () => void;
	/** The scrub gesture ended (pointer-up/cancel). */
	onScrubEnd?: () => void;
	/**
	 * False detaches the document-level keyboard shortcuts (e.g. while a
	 * confirm dialog is open). Defaults to true.
	 */
	shortcutsEnabled?: boolean;
	/**
	 * Filmstrip data. This strip draws no tiles; the filmstrip only fixes the
	 * zoom ceiling so both tools share the same four-stop ladder.
	 */
	filmstrip?: FilmstripState;
	/**
	 * True when a manually uploaded chapters VTT governs this video: the
	 * strip stays a read-only visualization and the rows list is replaced by
	 * a notice.
	 */
	readOnly?: boolean;
};

/**
 * The title of the chapter the playhead is in: the last chapter whose start
 * is at or before the playhead (the first chapter is pinned to 0, so one
 * always matches a non-negative playhead).
 *
 * @param session   - The chapters session.
 * @param currentMs - Live playhead position in ms.
 * @return The current chapter's title.
 */
function nowChapterTitle( session: ChaptersSession, currentMs: number ): string {
	let title = session.chapters[ 0 ].title;
	for ( const chapter of session.chapters ) {
		if ( chapter.startMs > currentMs ) {
			break;
		}
		title = chapter.title;
	}
	return title;
}

/**
 * The Chapters tool timeline.
 *
 * @param props                  - Component props.
 * @param props.session          - The chapters session.
 * @param props.dispatch         - Dispatch into the history-wrapped reducer.
 * @param props.currentMs        - Live playhead position in ms.
 * @param props.onSeek           - Seek the preview player.
 * @param props.onTogglePlay     - Toggle preview playback.
 * @param props.playing          - Whether preview playback is running.
 * @param props.locked           - Whether a processing job locks the strip.
 * @param props.onScrubStart     - A scrub gesture started.
 * @param props.onScrubEnd       - The scrub gesture ended.
 * @param props.shortcutsEnabled - Whether the document-level shortcuts attach.
 * @param props.filmstrip        - Filmstrip data (zoom ceiling only).
 * @param props.readOnly         - Whether a manual VTT locks editing.
 * @return The timeline element.
 */
export default function StudioChaptersTimeline( {
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
	readOnly = false,
}: StudioChaptersTimelineProps ): ReactElement {
	const durationMs = session.durationMs;

	const seekClamped = useCallback(
		( ms: number ) => onSeek( clampToDuration( ms, durationMs ) ),
		[ onSeek, durationMs ]
	);

	useKeyboardShortcuts( {
		enabled: shortcutsEnabled,
		onTogglePlay,
		onNudge: delta => seekClamped( currentMs + delta ),
		onHome: () => onSeek( 0 ),
		onEnd: () => onSeek( durationMs ),
		onRemoveSelectedCut: () => {
			// The reducer floors removal at one chapter; readOnly drops edits.
			if ( ! readOnly && session.selectedId !== null ) {
				dispatch( { type: 'REMOVE', id: session.selectedId } );
			}
		},
		onUndo: () => dispatch( { type: 'UNDO' } ),
		onRedo: () => dispatch( { type: 'REDO' } ),
	} );

	return (
		<div className="vp-studio-chapters" data-testid="studio-chapters">
			<StudioTimelineShell
				durationMs={ durationMs }
				currentMs={ currentMs }
				playing={ playing }
				locked={ locked }
				getZoomMax={ viewportWidth => getFilmstripZoomMax( filmstrip, durationMs, viewportWidth ) }
				onSeek={ onSeek }
				onScrubStart={ onScrubStart }
				onScrubEnd={ onScrubEnd }
				toolbar={ ( { zoom, zoomMax, applyZoom } ) => (
					<div className="vp-studio-timeline__toolbar">
						<StudioTimelineTransport
							playing={ playing }
							onTogglePlay={ onTogglePlay }
							currentMs={ currentMs }
							durationMs={ durationMs }
							onSeek={ seekClamped }
						/>
						<span className="vp-studio-timeline__toolbar-divider" aria-hidden="true" />
						<Button
							size="compact"
							variant="secondary"
							disabled={ readOnly || ! canAddChapterAt( session, currentMs ) }
							onClick={ () => dispatch( { type: 'ADD_AT', atMs: currentMs } ) }
							accessibleWhenDisabled
						>
							{ __( 'Add chapter at playhead', 'jetpack-videopress-pkg' ) }
						</Button>
						<span className="vp-studio-chapters__now" data-testid="studio-chapters-now">
							{ sprintf(
								/* translators: %s: title of the chapter the playhead is currently in. */
								__( 'Now: %s', 'jetpack-videopress-pkg' ),
								nowChapterTitle( session, currentMs )
							) }
						</span>
						<StudioEditorZoomControl
							zoom={ zoom }
							zoomMax={ zoomMax }
							onZoomChange={ applyZoom }
							onFit={ () => applyZoom( 1 ) }
						/>
					</div>
				) }
				tracks={ ( { pxPerMs } ) => [
					{
						id: 'ruler',
						element: <StudioEditorTimeRuler durationMs={ durationMs } pxPerMs={ pxPerMs } />,
					},
					{
						id: 'chapters',
						element: (
							<StudioChapterTrack session={ session } pxPerMs={ pxPerMs } dispatch={ dispatch } />
						),
					},
				] }
				overlay={ ( { pxPerMs, contentRef } ) =>
					readOnly ? null : (
						<div className="vp-studio-timeline__overlay" data-testid="studio-chapters-overlay">
							{ session.chapters.map( ( chapter, index ) =>
								// The first chapter is pinned to 0: no marker.
								index === 0 ? null : (
									<StudioChapterMarker
										key={ chapter.id }
										index={ index }
										session={ session }
										pxPerMs={ pxPerMs }
										contentRef={ contentRef }
										dispatch={ dispatch }
									/>
								)
							) }
						</div>
					)
				}
			/>
			{ readOnly ? (
				<p className="vp-studio-chapters__manual-notice" role="status">
					{ __(
						'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.',
						'jetpack-videopress-pkg'
					) }
				</p>
			) : (
				<StudioChapterRows session={ session } dispatch={ dispatch } onSeek={ seekClamped } />
			) }
			<p className="vp-studio-chapters__help">
				{ __(
					'Chapters appear in the player timeline and help viewers jump to a section. The first chapter always starts at 0:00:00.0.',
					'jetpack-videopress-pkg'
				) }
			</p>
		</div>
	);
}

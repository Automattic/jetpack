/**
 * The chapters editor timeline: the shared {@link TimelineShell} (toolbar
 * slot, scaled scrub surface, gridlines, playhead) composed with the
 * chapter-segments track, the draggable chapter-start markers, and the rows
 * list below the strip.
 *
 * This module owns everything chapters-specific: the toolbar's
 * "Add chapter at playhead" wiring (inert per the reducer's ADD_AT no-op
 * predicate), the "Now: {chapter}" indicator, and the document-level
 * shortcuts instance that attaches while THIS tool is mounted (space,
 * arrows, Home/End to the video bounds, Delete removes the selected chapter
 * — the reducer floors removal at one). The zoom ladder is the
 * duration-scaled filmstrip-less ladder ({@link getFilmstripZoomLadder})
 * even though this strip draws no tiles, so the zoom stops stay on the
 * filmstrip grammar's meaningful densities.
 *
 * `readOnly` (a manually uploaded chapters VTT exists) keeps the strip as a
 * visualization — segments render, the playhead scrubs — but removes every
 * edit affordance: no markers, the add button is disabled, and the rows list
 * is replaced by a notice.
 *
 * The publish rules live in `validateRows` and are what decides whether the
 * player gets a chapters track at all, so this module reads them live and
 * shows them where the problem is: row-scoped issues on the offending row,
 * the rest next to the footer help line. It is a pure read of the session —
 * nothing here gates saving, which stays a host decision.
 */
import { Button } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { validateRows } from '../../../utils/video-chapters/description';
import { canAddChapterAt, chaptersToRows } from '../state/chapters-session';
import TimeRuler from '../timeline/time-ruler';
import TimelineShell, { clampToDuration } from '../timeline/timeline-shell';
import TimelineTransport from '../timeline/transport';
import { useKeyboardShortcuts } from '../timeline/use-keyboard-shortcuts';
import ZoomControl from '../timeline/zoom-control';
import { getFilmstripZoomLadder } from '../timeline/zoom-ladder';
import ChapterMarker from './chapter-marker';
import ChapterRows from './chapter-rows';
import ChapterTrack from './chapter-track';
import './style.scss';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

export type ChaptersTimelineProps = {
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
	 * True while a processing job or an in-flight save locks editing. Every
	 * control whose dispatch the parent's guard would drop goes inert — the
	 * add button here, the title inputs and trash buttons in the rows list —
	 * so nothing looks accepted and is then silently discarded. Pointer
	 * blocking stays scoped to the strip's scroller so the toolbar transport
	 * and zoom remain usable, and the parent owns the aria-busy announcement.
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
 * @param props.readOnly         - Whether a manual VTT locks editing.
 * @return The timeline element.
 */
export default function ChaptersTimeline( {
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
	readOnly = false,
}: ChaptersTimelineProps ): ReactElement {
	const durationMs = session.durationMs;

	// Live publish-rule check. Row-scoped issues are keyed by ROW POSITION —
	// the same order `chaptersToRows` and the rows list walk — so they index
	// straight into the rows array; the rest (no chapters, too few) have no
	// row to sit on and go by the footer help line.
	//
	// The duration is passed UNROUNDED, matching what both hosts hand
	// `validateRows` at save time: rounding here would let a chapter sitting
	// on the rounded-up second (reachable through LOAD, which reflects the
	// description as-is) read as fine in the editor and then warn on save,
	// with no row flagged to explain it.
	const { rowIssues, generalIssues } = useMemo( () => {
		// A lone chapter is the "nothing authored yet" state: a description
		// with no chapter lines loads as one seeded chapter at 0:00, and
		// greeting that with "at least three chapters are required" scolds
		// the user before they have done anything. Stay quiet until there is
		// a set to judge; the save-time message still tells the truth if they
		// save one anyway.
		if ( session.chapters.length < 2 ) {
			return { rowIssues: [], generalIssues: [] };
		}
		const { issues } = validateRows( chaptersToRows( session ), session.durationMs / 1000 );
		const perRow: ( string | undefined )[] = [];
		for ( const issue of issues ) {
			if ( issue.rowIndex !== undefined && perRow[ issue.rowIndex ] === undefined ) {
				perRow[ issue.rowIndex ] = issue.message;
			}
		}
		return {
			rowIssues: perRow,
			generalIssues: issues.filter( issue => issue.rowIndex === undefined ),
		};
	}, [ session ] );

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
		onRemoveSelected: () => {
			// The reducer floors removal at one chapter; readOnly drops edits.
			if ( ! readOnly && session.selectedId !== null ) {
				dispatch( { type: 'REMOVE', id: session.selectedId } );
			}
		},
		onUndo: () => dispatch( { type: 'UNDO' } ),
		onRedo: () => dispatch( { type: 'REDO' } ),
	} );

	return (
		<div className="vp-chapters" data-testid="chapters">
			<TimelineShell
				durationMs={ durationMs }
				currentMs={ currentMs }
				playing={ playing }
				locked={ locked }
				getZoomLadder={ viewportWidth => getFilmstripZoomLadder( durationMs, viewportWidth ) }
				onSeek={ onSeek }
				onScrubStart={ onScrubStart }
				onScrubEnd={ onScrubEnd }
				toolbar={ ( { zoom, zoomLadder, applyZoom } ) => (
					<div className="vp-chapters-timeline__toolbar">
						<TimelineTransport
							playing={ playing }
							onTogglePlay={ onTogglePlay }
							currentMs={ currentMs }
							durationMs={ durationMs }
							onSeek={ seekClamped }
						/>
						<span className="vp-chapters-timeline__toolbar-divider" aria-hidden="true" />
						<Button
							size="compact"
							variant="secondary"
							disabled={ readOnly || locked || ! canAddChapterAt( session, currentMs ) }
							onClick={ () => dispatch( { type: 'ADD_AT', atMs: currentMs } ) }
							accessibleWhenDisabled
						>
							{ __( 'Add chapter at playhead', 'jetpack-videopress-pkg' ) }
						</Button>
						<span className="vp-chapters__now" data-testid="chapters-now">
							{ sprintf(
								/* translators: %s: title of the chapter the playhead is currently in. */
								__( 'Now: %s', 'jetpack-videopress-pkg' ),
								nowChapterTitle( session, currentMs )
							) }
						</span>
						<ZoomControl
							zoom={ zoom }
							ladder={ zoomLadder }
							onZoomChange={ applyZoom }
							onFit={ () => applyZoom( 1 ) }
						/>
					</div>
				) }
				tracks={ ( { pxPerMs } ) => [
					{
						id: 'ruler',
						element: <TimeRuler durationMs={ durationMs } pxPerMs={ pxPerMs } />,
					},
					{
						id: 'chapters',
						element: <ChapterTrack session={ session } pxPerMs={ pxPerMs } dispatch={ dispatch } />,
					},
				] }
				overlay={ ( { pxPerMs, contentRef } ) =>
					readOnly ? null : (
						<div className="vp-chapters-timeline__overlay" data-testid="chapters-overlay">
							{ session.chapters.map( ( chapter, index ) =>
								// The first chapter is pinned to 0: no marker.
								index === 0 ? null : (
									<ChapterMarker
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
				<p className="vp-chapters__manual-notice" role="status">
					{ __(
						'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.',
						'jetpack-videopress-pkg'
					) }
				</p>
			) : (
				<ChapterRows
					session={ session }
					dispatch={ dispatch }
					onSeek={ seekClamped }
					locked={ locked }
					rowIssues={ rowIssues }
				/>
			) }
			{ ! readOnly && generalIssues.length > 0 ? (
				<div className="vp-chapters__validation" role="status" data-testid="chapters-validation">
					{ generalIssues.map( issue => (
						<p key={ issue.code } className="vp-chapters__validation-message">
							{ issue.message }
						</p>
					) ) }
				</div>
			) : null }
			<p className="vp-chapters__help">
				{ __(
					'Chapters appear in the player timeline and help viewers jump to a section. The first chapter always starts at 0:00:00.0.',
					'jetpack-videopress-pkg'
				) }
			</p>
		</div>
	);
}

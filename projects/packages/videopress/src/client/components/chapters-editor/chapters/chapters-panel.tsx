/**
 * The chapters panel: the list pane that sits beside the preview player and
 * timeline in both hosts (the block editor's chapter manager modal and the
 * dashboard's Editor tab) — the "Chapters" header with the live count, the
 * publish-rule summary, and the editable rows list. When a manually uploaded
 * chapters VTT governs the video (`readOnly`) the rows are replaced by an
 * explanatory notice, mirroring what the timeline strip does with its edit
 * affordances.
 *
 * Publish-rule validation lives HERE, not in the timeline: the rows are
 * where rule violations get fixed, so the messages sit beside them.
 * Row-scoped issues land on the offending row; issues with no row to sit on
 * (no chapters, too few) plus the untitled-chapters rollup go under the
 * header, where they read as the panel's to-do list. It is a pure read of
 * the session — nothing here gates saving, which stays a host decision.
 *
 * Hosts own the panel's placement and sizing (side pane vs. stacked below
 * the timeline on narrow surfaces); the panel only promises a column layout
 * whose list region scrolls when the host bounds its height.
 */
import { _n, sprintf, __ } from '@wordpress/i18n';
import { memo, useCallback, useMemo } from 'react';
import { validateRows } from '../../../utils/video-chapters/description';
import { chaptersToRows } from '../state/chapters-session';
import { clampToDuration } from '../timeline/timeline-shell';
import ChapterRows from './chapter-rows';
import './style.scss';
import type { ChaptersSession, ChaptersSessionAction } from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

export type ChaptersPanelProps = {
	/** The chapters session. */
	session: ChaptersSession;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
	/** Seek the preview player to a master-timeline ms (clamped here). */
	onSeek: ( ms: number ) => void;
	/** True while a processing job or an in-flight save locks editing. */
	locked?: boolean;
	/**
	 * True when a manually uploaded chapters VTT governs this video: the rows
	 * list is replaced by a notice.
	 */
	readOnly?: boolean;
};

/**
 * The chapters panel.
 *
 * @param props          - Component props.
 * @param props.session  - The chapters session.
 * @param props.dispatch - Dispatch into the history-wrapped reducer.
 * @param props.onSeek   - Seek the preview player.
 * @param props.locked   - Whether a processing job or save locks editing.
 * @param props.readOnly - Whether a manual VTT locks editing.
 * @return The panel element.
 */
function ChaptersPanel( {
	session,
	dispatch,
	onSeek,
	locked = false,
	readOnly = false,
}: ChaptersPanelProps ): ReactElement {
	const durationMs = session.durationMs;

	// Live publish-rule check. Row-scoped issues are keyed by ROW POSITION —
	// the same order `chaptersToRows` and the rows list walk — so they index
	// straight into the rows array; the rest have no row to sit on and go
	// under the header, next to the untitled-chapters rollup.
	//
	// The duration is passed UNROUNDED, matching what both hosts hand
	// `validateRows` at save time: rounding here would let a chapter sitting
	// on the rounded-up second (reachable through LOAD, which reflects the
	// description as-is) read as fine in the editor and then warn on save,
	// with no row flagged to explain it.
	const { rowIssues, generalIssues, untitledCount } = useMemo( () => {
		// A lone chapter is the "nothing authored yet" state: a description
		// with no chapter lines loads as one seeded chapter at 0:00, and
		// greeting that with rule messages scolds the user before they have
		// done anything. Stay quiet until there is a set to judge; the
		// save-time message still tells the truth if they save one anyway.
		if ( session.chapters.length < 2 ) {
			return { rowIssues: [], generalIssues: [], untitledCount: 0 };
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
			// Counted from the validator's own verdicts so the rollup can never
			// disagree with the per-row flags about what "untitled" means.
			untitledCount: issues.filter( issue => issue.code === 'missing-title' ).length,
		};
	}, [ session ] );

	const seekClamped = useCallback(
		( ms: number ) => onSeek( clampToDuration( ms, durationMs ) ),
		[ onSeek, durationMs ]
	);

	return (
		<div className="vp-chapters-panel" data-testid="chapters-panel">
			<div className="vp-chapters-panel__header">
				<h3 className="vp-chapters-panel__title">{ __( 'Chapters', 'jetpack-videopress-pkg' ) }</h3>
				<span className="vp-chapters-panel__count" data-testid="chapters-count">
					{ session.chapters.length }
				</span>
			</div>
			{ ! readOnly && ( untitledCount > 0 || generalIssues.length > 0 ) ? (
				<div className="vp-chapters-panel__issues" role="status" data-testid="chapters-validation">
					{ untitledCount > 0 ? (
						<p className="vp-chapters__validation-message">
							{ sprintf(
								/* translators: %d: number of chapters with an empty title. */
								_n(
									'%d chapter still needs a title.',
									'%d chapters still need a title.',
									untitledCount,
									'jetpack-videopress-pkg'
								),
								untitledCount
							) }
						</p>
					) : null }
					{ generalIssues.map( issue => (
						<p key={ issue.code } className="vp-chapters__validation-message">
							{ issue.message }
						</p>
					) ) }
				</div>
			) : null }
			{ readOnly ? (
				<p className="vp-chapters__manual-notice" role="status">
					{ __(
						'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.',
						'jetpack-videopress-pkg'
					) }
				</p>
			) : (
				<div className="vp-chapters-panel__list">
					<ChapterRows
						session={ session }
						dispatch={ dispatch }
						onSeek={ seekClamped }
						locked={ locked }
						rowIssues={ rowIssues }
					/>
				</div>
			) }
		</div>
	);
}

/*
 * Memoized: while the preview plays, the rAF-driven playhead re-renders the
 * hosts every animation frame. The panel deliberately takes no playhead
 * prop, and every prop it does take is stable during playback (the session
 * changes only on edits; dispatch and onSeek are []-dep callbacks in the
 * hosts) — memo is what turns that decoupling into skipped work.
 */
export default memo( ChaptersPanel );

/**
 * The rows list below the Chapters tool strip: one row per chapter with the
 * mono index, the title input, the start-time seek button, the computed
 * duration, and the remove button. This list is the accessible editing
 * surface for everything the strip's segments and markers do with pointers.
 *
 * Title edits are held in LOCAL draft state and committed on blur/Enter —
 * the same pattern as the Details-tab chapters editor: a half-typed title
 * must never round-trip through the session mid-keystroke (each keystroke
 * would otherwise burn an undo entry).
 *
 * Interacting with a row (pointer or keyboard focus) selects its chapter;
 * selection is not history-relevant, so browsing rows never consumes undo
 * entries. Removal no-ops at one chapter — the trash button goes inert —
 * and removing the first chapter re-pins the new first to 0 (both enforced
 * by the reducer; the button state just mirrors it).
 *
 * `locked` (a processing job or an in-flight save) disables every control
 * whose dispatch the host would drop anyway, so nothing looks accepted and
 * is then silently discarded. The start-time button stays live: seeking is
 * deliberately allowed while locked, like the toolbar transport.
 */
import { Button } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, trash } from '@wordpress/icons';
import { useEffect, useState } from 'react';
import { formatTimecode } from '../state/time-utils';
import type {
	ChapterEntry,
	ChaptersSession,
	ChaptersSessionAction,
} from '../state/chapters-session';
import type { HistoryAction } from '../state/history';
import type { ReactElement } from 'react';

type RowsProps = {
	/** The chapters session. */
	session: ChaptersSession;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
	/** True while a processing job or save locks editing: edit controls go inert. */
	locked?: boolean;
	/**
	 * Per-row validation message, indexed by ROW POSITION (the order
	 * `chaptersToRows` produces, which is `session.chapters` order), not by
	 * chapter id. Undefined entries are rows with nothing to flag.
	 */
	rowIssues?: ( string | undefined )[];
};

type RowProps = {
	/** The chapter this row edits. */
	chapter: ChapterEntry;
	/** Row position (0-based; rendered as the 1-based mono index). */
	index: number;
	/** Start of the next chapter (the video end for the last row), in ms. */
	endMs: number;
	/** Whether this row's chapter is selected. */
	selected: boolean;
	/** Whether removal is possible (false at one chapter: the trash is inert). */
	canRemove: boolean;
	/** Whether a processing job or save locks editing. */
	locked: boolean;
	/** Validation message for this row, when it has one. */
	issue?: string;
	/** Dispatch into the history-wrapped chapters reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
};

/**
 * One chapter row.
 *
 * @param props           - Component props.
 * @param props.chapter   - The chapter this row edits.
 * @param props.index     - Row position (0-based).
 * @param props.endMs     - Start of the next chapter (or the video end), in ms.
 * @param props.selected  - Whether this row's chapter is selected.
 * @param props.canRemove - Whether removal is possible.
 * @param props.locked    - Whether a processing job or save locks editing.
 * @param props.issue     - Validation message for this row, when it has one.
 * @param props.dispatch  - Dispatch into the history-wrapped reducer.
 * @param props.onSeek    - Seek the preview player.
 * @return The row element.
 */
function ChapterRow( {
	chapter,
	index,
	endMs,
	selected,
	canRemove,
	locked,
	issue,
	dispatch,
	onSeek,
}: RowProps ): ReactElement {
	const [ titleDraft, setTitleDraft ] = useState( chapter.title );

	// Re-baseline the draft when the committed title changes underneath us
	// (undo/redo, a marker drag reloading state, another surface renaming) —
	// and at both edges of the lock, because a rename typed just as the lock
	// arrived is dropped by the host's guarded dispatch, which leaves
	// `chapter.title` unchanged and would otherwise strand the phantom draft
	// in the input for the rest of the session.
	useEffect( () => {
		setTitleDraft( chapter.title );
	}, [ chapter.title, locked ] );

	const commitTitle = () => {
		// Mirror the reducer's normalization so an unchanged commit is
		// detected here and never dispatched at all.
		const title = titleDraft.replace( /\s*\n\s*/g, ' ' ).trim();
		setTitleDraft( title );
		if ( title !== chapter.title ) {
			dispatch( { type: 'RENAME', id: chapter.id, title } );
		}
	};

	const select = () => {
		if ( ! selected ) {
			dispatch( { type: 'SELECT', id: chapter.id } );
		}
	};

	const classes = [
		'vp-chapters__row',
		selected ? 'vp-chapters__row--selected' : '',
		issue ? 'vp-chapters__row--invalid' : '',
	]
		.filter( Boolean )
		.join( ' ' );
	const issueId = `vp-chapters-row-issue-${ chapter.id }`;

	return (
		<div
			className={ classes }
			data-testid={ `chapters-row-${ chapter.id }` }
			onPointerDown={ select }
			onFocusCapture={ select }
		>
			<span className="vp-chapters__row-index" aria-hidden="true">
				{ String( index + 1 ).padStart( 2, '0' ) }
			</span>
			<input
				className="vp-chapters__row-title"
				type="text"
				value={ titleDraft }
				aria-label={ sprintf(
					/* translators: %d: 1-based chapter number. */
					__( 'Chapter %d title', 'jetpack-videopress-pkg' ),
					index + 1
				) }
				aria-describedby={ issue ? issueId : undefined }
				disabled={ locked }
				onChange={ event => setTitleDraft( event.target.value ) }
				onBlur={ commitTitle }
				onKeyDown={ event => {
					if ( event.key === 'Enter' ) {
						commitTitle();
					} else if ( event.key === 'Escape' ) {
						// Consuming Escape must mark the event handled: modal hosts
						// (the chapter manager) close on any unhandled Escape, and
						// "cancel this title edit" must not double as "close the
						// modal" — the same contract TimecodeBox follows. Unlike
						// TimecodeBox the field is NOT blurred afterwards: focus
						// belongs in the row you were editing, and keeping it here
						// also makes the later blur a no-op, since `commitTitle`
						// returns early on an unchanged title.
						event.preventDefault();
						setTitleDraft( chapter.title );
					}
				} }
			/>
			<button
				type="button"
				className="vp-chapters__row-time"
				data-testid={ `chapters-row-time-${ chapter.id }` }
				aria-label={ sprintf(
					/* translators: %s: chapter start timecode, e.g. "0:01:05.0". */
					__( 'Go to %s', 'jetpack-videopress-pkg' ),
					formatTimecode( chapter.startMs )
				) }
				onClick={ () => onSeek( chapter.startMs ) }
			>
				{ formatTimecode( chapter.startMs ) }
			</button>
			<span className="vp-chapters__row-duration">
				{ formatTimecode( endMs - chapter.startMs ) }
			</span>
			<Button
				className="vp-chapters__row-remove"
				size="small"
				icon={ <Icon icon={ trash } size={ 20 } /> }
				label={ sprintf(
					/* translators: %d: 1-based chapter number. */
					__( 'Remove chapter %d', 'jetpack-videopress-pkg' ),
					index + 1
				) }
				disabled={ locked || ! canRemove }
				accessibleWhenDisabled
				onClick={ () => dispatch( { type: 'REMOVE', id: chapter.id } ) }
			/>
			{ issue ? (
				<span
					className="vp-chapters__row-issue"
					id={ issueId }
					data-testid={ `chapters-row-issue-${ chapter.id }` }
				>
					{ issue }
				</span>
			) : null }
		</div>
	);
}

/**
 * The chapters rows list.
 *
 * @param props           - Component props.
 * @param props.session   - The chapters session.
 * @param props.dispatch  - Dispatch into the history-wrapped reducer.
 * @param props.onSeek    - Seek the preview player.
 * @param props.locked    - Whether a processing job or save locks editing.
 * @param props.rowIssues - Validation messages indexed by row position.
 * @return The rows-list element.
 */
export default function ChapterRows( {
	session,
	dispatch,
	onSeek,
	locked = false,
	rowIssues,
}: RowsProps ): ReactElement {
	const { chapters, durationMs, selectedId } = session;

	return (
		<div className="vp-chapters__rows" data-testid="chapters-rows">
			{ chapters.map( ( chapter, index ) => (
				<ChapterRow
					key={ chapter.id }
					chapter={ chapter }
					index={ index }
					endMs={ index === chapters.length - 1 ? durationMs : chapters[ index + 1 ].startMs }
					selected={ chapter.id === selectedId }
					canRemove={ chapters.length > 1 }
					locked={ locked }
					// `chaptersToRows` preserves `session.chapters` order, so the
					// validator's rowIndex is this map's index.
					issue={ rowIssues?.[ index ] }
					dispatch={ dispatch }
					onSeek={ onSeek }
				/>
			) ) }
		</div>
	);
}

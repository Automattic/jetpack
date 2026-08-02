/**
 * The Chapters tool's session store: a history-wrapped reducer, so undo/redo
 * stays PER TOOL (binding decision).
 *
 * The video description is the single source of truth for chapters. The
 * store LOADs `parseDescription( description )` at mount and re-LOADs when
 * the description (or the duration) changes while the session is CLEAN —
 * e.g. the Details tab saved a new description; a dirty session is never
 * clobbered by a background refetch. Dirtiness is measured against what LOAD
 * actually produced (via `chaptersToRows`), not the raw parsed rows: LOAD
 * normalizes (sorts, pins the first chapter to 0, seeds a default chapter
 * for an empty description), and that normalization must not count as user
 * edits — a video without chapters would otherwise mount "dirty" and arm
 * every navigation guard unprompted.
 *
 * Dispatches are guarded: dropped while the editor is locked (processing
 * job, in-flight save), so keyboard-driven edits can't slip in while the
 * strip's pointer events are blocked.
 *
 * The header Save re-baselines through `markSaved( savedDescription )` once
 * its meta POST succeeds, and Discard drops unsaved edits via `discard()` —
 * both re-LOAD (which clears the tool's history) and move the baseline.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { parseDescription } from '../../utils/video-chapters/description';
import {
	chaptersEditsEqual,
	chaptersSessionReducer,
	chaptersToRows,
	createChaptersSession,
	isChaptersDirty,
} from './state/chapters-session';
import { createHistory, withHistory } from './state/history';
import type { ChaptersSession, ChaptersSessionAction } from './state/chapters-session';
import type { HistoryAction, HistoryState } from './state/history';
import type { ChapterRow } from '../../utils/video-chapters/description';

const chaptersHistoryReducer = withHistory< ChaptersSession, ChaptersSessionAction >(
	chaptersSessionReducer,
	{
		clearOn: action => action.type === 'LOAD',
		// Selection is not history: browsing chapters must not eat undo
		// entries (or clear redo), and a marker drag that returns to its
		// exact start must commit nothing.
		equals: chaptersEditsEqual,
	}
);

/**
 * Build the session a description LOADs to.
 *
 * @param description - The video description.
 * @param durationMs  - Video duration in ms.
 * @return The loaded session.
 */
function loadSession( description: string, durationMs: number ): ChaptersSession {
	return chaptersSessionReducer( createChaptersSession( durationMs ), {
		type: 'LOAD',
		rows: parseDescription( description ).rows,
		durationMs,
	} );
}

type Baseline = {
	/** The description the session was LOADed from. */
	description: string;
	/** The duration the session was LOADed with. */
	durationMs: number;
	/** The rows that LOAD produced (normalized), for the dirty comparison. */
	rows: ChapterRow[];
};

/**
 * Options for {@link useChaptersStore}.
 */
export interface ChaptersStoreOptions {
	/** The video description (the chapters source of truth). */
	description: string;
	/** Video duration in ms (the OUTPUT video — chapters live on it). */
	durationMs: number;
	/** True while the editor is locked; edit dispatches are dropped. */
	locked: boolean;
}

/**
 * Value returned by {@link useChaptersStore}.
 */
export interface ChaptersStore {
	/** The full history state (for canUndo/canRedo). */
	history: HistoryState< ChaptersSession >;
	/** The current session (history.present). */
	session: ChaptersSession;
	/** Guarded dispatch into the history-wrapped reducer. */
	dispatch: ( action: HistoryAction< ChaptersSessionAction > ) => void;
	/** Whether saving would change the description's chapter lines. */
	chaptersDirty: boolean;
	/** Re-baseline on a just-saved description: LOAD it and clear history. */
	markSaved: ( description: string ) => void;
	/** Reset the session to the loaded baseline (unsaved edits are dropped). */
	discard: () => void;
}

/**
 * Own the Chapters tool's history-wrapped session store.
 *
 * @param options - Description, duration, and the lock flag.
 * @return The store handle.
 */
export function useChaptersStore( options: ChaptersStoreOptions ): ChaptersStore {
	const { description, durationMs, locked } = options;

	const [ history, rawDispatch ] = useReducer( chaptersHistoryReducer, options, initial =>
		createHistory( loadSession( initial.description, initial.durationMs ) )
	);
	const session = history.present;

	const [ baseline, setBaseline ] = useState< Baseline >( () => ( {
		description,
		durationMs,
		rows: chaptersToRows( loadSession( description, durationMs ) ),
	} ) );

	const chaptersDirty = useMemo(
		() => isChaptersDirty( session, baseline.rows ),
		[ session, baseline.rows ]
	);

	// Re-baseline when the source of truth moves under a CLEAN session (the
	// Details tab saved a description, the duration refined). Local edits
	// win: a dirty session keeps its old baseline until it is saved or
	// discarded — and if it becomes clean again (undo), the pending change
	// loads then, because chaptersDirty is a dependency here.
	useEffect( () => {
		if ( chaptersDirty ) {
			return;
		}
		if ( description === baseline.description && durationMs === baseline.durationMs ) {
			return;
		}
		const loaded = loadSession( description, durationMs );
		rawDispatch( {
			type: 'LOAD',
			rows: parseDescription( description ).rows,
			durationMs,
		} );
		setBaseline( { description, durationMs, rows: chaptersToRows( loaded ) } );
	}, [ description, durationMs, chaptersDirty, baseline ] );

	// While a job is processing (or a save is in flight) the editor is
	// locked: pointer events on the strip are blocked by CSS, and this guard
	// drops the document-level keyboard shortcuts' dispatches.
	const lockedRef = useRef( locked );
	lockedRef.current = locked;
	const dispatch = useCallback( ( action: HistoryAction< ChaptersSessionAction > ) => {
		if ( ! lockedRef.current ) {
			rawDispatch( action );
		}
	}, [] );

	// Refs for the stable baseline movers below, so their identities never
	// change (the save flow captures them in its own callbacks).
	const durationRef = useRef( durationMs );
	durationRef.current = durationMs;
	const baselineRef = useRef( baseline );
	baselineRef.current = baseline;

	// LOAD a description and make it the new baseline; the history clears via
	// the wrapper's clearOn. Deliberately NOT guarded on `locked`: the save
	// flow re-baselines while its own save still counts toward the lock, and
	// a baseline sync is not a user edit.
	const rebaseline = useCallback( ( nextDescription: string ) => {
		const nextDurationMs = durationRef.current;
		rawDispatch( {
			type: 'LOAD',
			rows: parseDescription( nextDescription ).rows,
			durationMs: nextDurationMs,
		} );
		setBaseline( {
			description: nextDescription,
			durationMs: nextDurationMs,
			rows: chaptersToRows( loadSession( nextDescription, nextDurationMs ) ),
		} );
	}, [] );

	// Discard re-LOADs the baseline's own description. If the source of truth
	// moved while the session was dirty (the store's re-LOAD effect held the
	// old baseline so local edits would win), the now-clean session converges
	// on the newer description through that same effect right after.
	const discard = useCallback( () => {
		rebaseline( baselineRef.current.description );
	}, [ rebaseline ] );

	return {
		history,
		session,
		dispatch,
		chaptersDirty,
		markSaved: rebaseline,
		discard,
	};
}

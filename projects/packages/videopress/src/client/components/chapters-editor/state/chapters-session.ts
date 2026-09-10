/**
 * Pure chapters-session state core for the Chapters tool.
 *
 * Chapters are stored second-granular: the video description's `H:MM:SS`
 * lines are the single source of truth (`utils/video-chapters/description`
 * owns parse/serialize/validate). The session works in integer MILLISECONDS
 * so marker drags can be smooth, and quantizes back to whole seconds when a
 * gesture commits (QUANTIZE) — committed sessions are second-granular,
 * drags may carry raw ms transiently.
 *
 * Invariants enforced by the reducer after every action: `chapters` is
 * non-empty and sorted ascending by start; the FIRST chapter is pinned to
 * `startMs === 0` (it has no drag marker, MOVE_START ignores it, and
 * removing it re-pins the new first to 0); every start is an integer ms;
 * `selectedId` always references an existing chapter, or is null.
 *
 * Interaction constraints, which are deliberately NOT applied to loaded
 * data (the session must reflect the description as-is, beyond sorting and
 * first-chapter pinning): MOVE_START clamps a start into
 * `[ prev + CHAPTER_MIN_GAP_MS, next − CHAPTER_MIN_GAP_MS ]` (last chapter:
 * `durationMs − CHAPTER_MIN_GAP_MS`), and ADD_AT no-ops within
 * ADD_DEDUPE_MS of an existing start or on an already-taken whole second.
 * The stricter publish rules (first at 0:00, ≥3 chapters, titled, ≥10s
 * apart) stay in `validateRows` and are enforced at save time, not here.
 *
 * Actions that would violate a constraint are clamped to the nearest valid
 * value rather than rejected, so pointer drags stop at the limit instead
 * of jumping. No-op actions return the previous state reference, which the
 * history wrapper relies on to skip empty entries.
 *
 * NOTE: chapter timestamps live on the OUTPUT video; saving a trim or cut
 * does not re-map chapter lines (out of scope by design).
 */
import { __, sprintf } from '@wordpress/i18n';
import type { ChapterRow } from '../../../utils/video-chapters/description';

/**
 * Minimum distance between two chapter starts that MOVE_START preserves.
 * Storage is second-granular, so the design's sub-second marker gap
 * reconciles to one whole second.
 */
export const CHAPTER_MIN_GAP_MS = 1000;

/**
 * Radius around an existing chapter start within which ADD_AT is a no-op,
 * so a playhead parked on a chapter cannot double-add it.
 */
export const ADD_DEDUPE_MS = 500;

/**
 * One chapter on the output-video timeline.
 */
export interface ChapterEntry {
	/** Stable identifier, unique within the session. */
	id: string;
	/** Chapter start, in ms. Whole seconds except transiently during drags. */
	startMs: number;
	/** Chapter title, single-line. */
	title: string;
}

/**
 * The full chapters state for one video.
 */
export interface ChaptersSession {
	/** Duration of the video, in ms. */
	durationMs: number;
	/** Non-empty, sorted ascending; `chapters[ 0 ].startMs` is pinned to 0. */
	chapters: ChapterEntry[];
	/** Currently selected chapter, or null. */
	selectedId: string | null;
}

/**
 * Actions understood by {@link chaptersSessionReducer}.
 */
export type ChaptersSessionAction =
	| { type: 'LOAD'; rows: ChapterRow[]; durationMs: number }
	| { type: 'ADD_AT'; atMs: number; title?: string; id?: string }
	| { type: 'MOVE_START'; id: string; startMs: number }
	| { type: 'RENAME'; id: string; title: string }
	| { type: 'REMOVE'; id: string }
	| { type: 'SELECT'; id: string | null }
	| { type: 'QUANTIZE' };

let chapterIdCounter = 0;

/**
 * Generate a session-unique chapter id.
 *
 * @return A fresh chapter id.
 */
function nextChapterId(): string {
	chapterIdCounter++;
	return `chapter-${ chapterIdCounter }`;
}

/**
 * Normalize a title to a single line, the same way the details-tab editor
 * commits drafts: newlines would break the description's line structure.
 *
 * @param raw - Title as provided by the caller.
 * @return Single-line trimmed title.
 */
function normalizeTitleText( raw: string ): string {
	return raw.replace( /\s*\n\s*/g, ' ' ).trim();
}

/**
 * The default title for the n-th chapter.
 *
 * @param n - 1-based chapter number.
 * @return The localized default title.
 */
function defaultTitle( n: number ): string {
	return sprintf(
		/* translators: %d: 1-based chapter number. */
		__( 'Chapter %d', 'jetpack-videopress-pkg' ),
		n
	);
}

/**
 * The default title for a chapter landing at `index`: its 1-based POSITION,
 * not the chapter count, so inserting into the middle does not read
 * "Chapter 1, Chapter 2, Chapter 5, Chapter 3". The number then advances
 * past any number already used as a title, so a new chapter never
 * duplicates an existing name (removing a chapter drops the count and would
 * otherwise let the next default reuse a live name).
 *
 * Existing chapters are never renumbered: their titles may have been typed
 * deliberately, and matching a TRANSLATED "Chapter %d" back out of them is
 * not something to build a rename on.
 *
 * @param chapters - Chapters the new one is joining.
 * @param index    - 0-based position the new chapter lands at.
 * @return The localized default title.
 */
function defaultTitleAt( chapters: ChapterEntry[], index: number ): string {
	const taken = new Set( chapters.map( chapter => chapter.title ) );
	let n = index + 1;
	while ( taken.has( defaultTitle( n ) ) ) {
		n++;
	}
	return defaultTitle( n );
}

/**
 * Round a millisecond value to the nearest whole second, in ms.
 *
 * @param ms - Raw milliseconds.
 * @return The nearest multiple of 1000.
 */
function roundToWholeSecondMs( ms: number ): number {
	return Math.round( ms / 1000 ) * 1000;
}

/**
 * Structural equality of the persistable chapter state of two sessions —
 * everything except the selection. This is the history-relevant comparison:
 * the undo/redo wrapper uses it so selection-only changes and gestures that
 * return to their exact start never consume undo entries.
 *
 * @param a - One session.
 * @param b - Another session.
 * @return Whether the sessions describe the same chapters.
 */
export function chaptersEditsEqual( a: ChaptersSession, b: ChaptersSession ): boolean {
	return (
		a.durationMs === b.durationMs &&
		a.chapters.length === b.chapters.length &&
		a.chapters.every(
			( chapter, i ) =>
				chapter.id === b.chapters[ i ].id &&
				chapter.startMs === b.chapters[ i ].startMs &&
				chapter.title === b.chapters[ i ].title
		)
	);
}

/**
 * Full structural equality of two sessions (chapters AND selection), used
 * to return the previous reference on no-op actions.
 *
 * @param a - One session.
 * @param b - Another session.
 * @return Whether the sessions are structurally identical.
 */
function chaptersSessionsEqual( a: ChaptersSession, b: ChaptersSession ): boolean {
	return a.selectedId === b.selectedId && chaptersEditsEqual( a, b );
}

/**
 * Convert a session to description rows: ms → integer seconds. Raw
 * mid-gesture ms round to the nearest second, matching what QUANTIZE
 * would commit.
 *
 * @param session - The session to convert.
 * @return Chapter rows in document (= start) order.
 */
export function chaptersToRows( session: ChaptersSession ): ChapterRow[] {
	return session.chapters.map( chapter => ( {
		startAtSeconds: Math.round( chapter.startMs / 1000 ),
		title: chapter.title,
	} ) );
}

/**
 * Whether the session's chapters differ from a baseline row list (as
 * parsed from the saved description). Selection is ignored. Note that
 * LOAD normalizes (sorts, pins the first chapter to 0, seeds a default
 * chapter when the description has none), so a session can be dirty
 * against a raw baseline without any user action — saving then heals the
 * description.
 *
 * @param session      - The current session.
 * @param baselineRows - Rows the description currently serializes to.
 * @return True when saving would change the description's chapter lines.
 */
export function isChaptersDirty( session: ChaptersSession, baselineRows: ChapterRow[] ): boolean {
	const rows = chaptersToRows( session );
	return (
		rows.length !== baselineRows.length ||
		rows.some(
			( row, i ) =>
				row.startAtSeconds !== baselineRows[ i ].startAtSeconds ||
				row.title !== baselineRows[ i ].title
		)
	);
}

/**
 * Build a session from parsed description rows. Rows are sorted ascending
 * (stable, so equal starts keep document order) and converted to ms; the
 * first chapter is pinned to 0; an empty row list seeds a single default
 * chapter so the session is never empty. Starts beyond the duration are
 * kept — the session must reflect what the description has, and
 * `validateRows` surfaces the problem at save time.
 *
 * @param rows       - Chapter rows, e.g. from `parseDescription`.
 * @param durationMs - Video duration in ms.
 * @return The loaded session.
 */
function sessionFromRows( rows: ChapterRow[], durationMs: number ): ChaptersSession {
	const duration = Math.max( 0, Math.round( durationMs ) );
	const chapters = [ ...rows ]
		.sort( ( a, b ) => a.startAtSeconds - b.startAtSeconds )
		.map( row => ( {
			id: nextChapterId(),
			startMs: Math.round( row.startAtSeconds * 1000 ),
			title: row.title,
		} ) );

	if ( chapters.length === 0 ) {
		chapters.push( { id: nextChapterId(), startMs: 0, title: defaultTitle( 1 ) } );
	} else if ( chapters[ 0 ].startMs !== 0 ) {
		chapters[ 0 ] = { ...chapters[ 0 ], startMs: 0 };
	}

	return { durationMs: duration, chapters, selectedId: null };
}

/**
 * Create a pristine session with a single default chapter at 0.
 *
 * @param durationMs - Video duration in ms.
 * @return A fresh session.
 */
export function createChaptersSession( durationMs: number ): ChaptersSession {
	return sessionFromRows( [], durationMs );
}

/**
 * The whole second (in ms) ADD_AT would add a chapter at: the playhead
 * clamped to the video, rounded to the nearest whole second, capped at the
 * last whole second at or before `durationMs − CHAPTER_MIN_GAP_MS`. The cap
 * mirrors the upper bound MOVE_START enforces for the last chapter, so a
 * chapter added at the very end of the video still starts inside its own
 * drag window instead of ON the video end (which would render zero-width
 * and save a zero-length final cue).
 *
 * @param durationMs - Video duration in ms.
 * @param atMs       - Playhead position in ms.
 * @return The candidate chapter start.
 */
function addTargetMs( durationMs: number, atMs: number ): number {
	const wholeSecondCap = Math.max(
		0,
		Math.floor( ( durationMs - CHAPTER_MIN_GAP_MS ) / 1000 ) * 1000
	);
	const clamped = Math.min( Math.max( 0, atMs ), Math.max( 0, durationMs ) );
	return Math.min( roundToWholeSecondMs( clamped ), wholeSecondCap );
}

/**
 * Whether ADD_AT at this playhead would add a chapter. False when the
 * playhead is within {@link ADD_DEDUPE_MS} of an existing start or the
 * target whole second is already taken. The toolbar uses this to render
 * "Add chapter at playhead" as inert.
 *
 * @param session - Current session.
 * @param atMs    - Playhead position in ms.
 * @return True when a chapter would be added.
 */
export function canAddChapterAt( session: ChaptersSession, atMs: number ): boolean {
	const at = addTargetMs( session.durationMs, atMs );
	return ! session.chapters.some(
		chapter =>
			Math.abs( chapter.startMs - atMs ) < ADD_DEDUPE_MS ||
			roundToWholeSecondMs( chapter.startMs ) === at
	);
}

/**
 * Add a chapter at the playhead's whole second and select it. No-op when
 * {@link canAddChapterAt} says so. The default title numbers the chapter by
 * its insertion position (see {@link defaultTitleAt}); an explicit title is
 * normalized to one line (and falls back to the default when it normalizes
 * to empty).
 *
 * @param state - Current session.
 * @param atMs  - Playhead position in ms.
 * @param title - Optional explicit title.
 * @param id    - Explicit id for the new chapter (tests/UI).
 * @return Next session.
 */
function addAt(
	state: ChaptersSession,
	atMs: number,
	title?: string,
	id?: string
): ChaptersSession {
	if ( ! canAddChapterAt( state, atMs ) ) {
		return state;
	}
	const normalized = title === undefined ? '' : normalizeTitleText( title );
	// Resolve the start first: the position it sorts into is what the default
	// title numbers, and a taken second is already a no-op above, so counting
	// the chapters that start earlier gives the final index.
	const startMs = addTargetMs( state.durationMs, atMs );
	const index = state.chapters.filter( chapter => chapter.startMs < startMs ).length;
	const entry: ChapterEntry = {
		id: id ?? nextChapterId(),
		startMs,
		title: normalized === '' ? defaultTitleAt( state.chapters, index ) : normalized,
	};
	// The first chapter sits at 0 and a taken second is a no-op above, so
	// the new entry can never displace the pinned first chapter.
	const chapters = [ ...state.chapters, entry ].sort( ( a, b ) => a.startMs - b.startMs );
	return { ...state, chapters, selectedId: entry.id };
}

/**
 * Move a chapter's start, clamped between its neighbors' starts padded by
 * {@link CHAPTER_MIN_GAP_MS} (the last chapter is capped at
 * `durationMs − CHAPTER_MIN_GAP_MS`). The first chapter is pinned and
 * never moves. Raw (sub-second) ms are accepted so drags track the
 * pointer; QUANTIZE re-grids them at commit time.
 *
 * @param state   - Current session.
 * @param id      - Id of the chapter being moved.
 * @param startMs - Requested new start in ms.
 * @return Next session.
 */
function moveStart( state: ChaptersSession, id: string, startMs: number ): ChaptersSession {
	const index = state.chapters.findIndex( chapter => chapter.id === id );
	if ( index <= 0 ) {
		// Unknown id, or the pinned first chapter.
		return state;
	}
	const lower = state.chapters[ index - 1 ].startMs + CHAPTER_MIN_GAP_MS;
	const upper =
		index === state.chapters.length - 1
			? state.durationMs - CHAPTER_MIN_GAP_MS
			: state.chapters[ index + 1 ].startMs - CHAPTER_MIN_GAP_MS;
	if ( lower > upper ) {
		// Degenerate window (e.g. loaded data tighter than the gap): immovable.
		return state;
	}
	const next = Math.min( upper, Math.max( lower, Math.round( startMs ) ) );
	if ( next === state.chapters[ index ].startMs ) {
		return state;
	}
	const chapters = state.chapters.map( ( chapter, i ) =>
		i === index ? { ...chapter, startMs: next } : chapter
	);
	return { ...state, chapters };
}

/**
 * Commit-time quantization: move every start carrying raw ms to a whole
 * second inside its drag window. Dispatch as the closing action of a marker
 * drag (before COMMIT) so committed sessions are always second-granular.
 *
 * Rounding to the nearest second and letting MOVE_START clamp is NOT enough:
 * the clamp bounds themselves can be fractional — the last chapter's ceiling
 * is `durationMs − CHAPTER_MIN_GAP_MS` (fractional for real media
 * durations), and a mid-pass sibling can still carry raw ms — so
 * round-then-clamp could commit (or silently keep, via the no-op equality
 * check) a fractional start, breaking the committed-sessions-are-
 * second-granular invariant. Instead the target is clamped to the GRID
 * window `[ ceil( lower/1000 )·1000, floor( upper/1000 )·1000 ]`, which
 * always lies inside the raw window, so MOVE_START applies it verbatim.
 *
 * The pass runs ascending from index 1 (the first chapter is pinned to 0,
 * never fractional): each chapter's lower bound then sees an
 * already-quantized predecessor, so one pass converges and is idempotent.
 * The empty-grid-window skip is defense-in-depth only — with a whole-second
 * predecessor an empty grid window implies an empty raw window, which
 * MOVE_START already treats as immovable, so it is unreachable through
 * actions. It exists for hand-corrupted states (e.g. persisted pre-fix
 * sessions), where `validateRows` flags the leftover raw start at save time.
 *
 * @param state - Current session.
 * @return Next session.
 */
function quantize( state: ChaptersSession ): ChaptersSession {
	let next = state;
	for ( let index = 1; index < next.chapters.length; index++ ) {
		const chapter = next.chapters[ index ];
		if ( chapter.startMs % 1000 === 0 ) {
			continue;
		}
		const lower = next.chapters[ index - 1 ].startMs + CHAPTER_MIN_GAP_MS;
		const upper =
			index === next.chapters.length - 1
				? next.durationMs - CHAPTER_MIN_GAP_MS
				: next.chapters[ index + 1 ].startMs - CHAPTER_MIN_GAP_MS;
		const gridLower = Math.ceil( lower / 1000 ) * 1000;
		const gridUpper = Math.floor( upper / 1000 ) * 1000;
		if ( gridLower > gridUpper ) {
			continue;
		}
		next = moveStart(
			next,
			chapter.id,
			Math.min( gridUpper, Math.max( gridLower, roundToWholeSecondMs( chapter.startMs ) ) )
		);
	}
	return next;
}

/**
 * The chapters-session reducer. Enforces every invariant documented on
 * {@link ChaptersSession}; returns the previous state reference for no-ops.
 *
 * @param state  - Current session.
 * @param action - Action to apply.
 * @return Next session.
 */
export function chaptersSessionReducer(
	state: ChaptersSession,
	action: ChaptersSessionAction
): ChaptersSession {
	let next: ChaptersSession;

	switch ( action.type ) {
		case 'LOAD':
			next = sessionFromRows( action.rows, action.durationMs );
			break;

		case 'ADD_AT':
			next = addAt( state, action.atMs, action.title, action.id );
			break;

		case 'MOVE_START':
			next = moveStart( state, action.id, action.startMs );
			break;

		case 'RENAME': {
			const index = state.chapters.findIndex( chapter => chapter.id === action.id );
			if ( index === -1 ) {
				return state;
			}
			const title = normalizeTitleText( action.title );
			next = {
				...state,
				chapters: state.chapters.map( ( chapter, i ) =>
					i === index ? { ...chapter, title } : chapter
				),
			};
			break;
		}

		case 'REMOVE': {
			if ( state.chapters.length <= 1 ) {
				return state;
			}
			const chapters = state.chapters.filter( chapter => chapter.id !== action.id );
			if ( chapters.length === state.chapters.length ) {
				return state;
			}
			// Removing the first chapter re-pins the new first to 0.
			if ( chapters[ 0 ].startMs !== 0 ) {
				chapters[ 0 ] = { ...chapters[ 0 ], startMs: 0 };
			}
			next = {
				...state,
				chapters,
				selectedId: state.selectedId === action.id ? null : state.selectedId,
			};
			break;
		}

		case 'SELECT':
			if ( action.id !== null && ! state.chapters.some( chapter => chapter.id === action.id ) ) {
				return state;
			}
			next = { ...state, selectedId: action.id };
			break;

		case 'QUANTIZE':
			next = quantize( state );
			break;

		default:
			return state;
	}

	return chaptersSessionsEqual( state, next ) ? state : next;
}

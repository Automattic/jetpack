/**
 * Pure edit-session state core for the Studio TRIM & CUT editor.
 *
 * The editor is non-destructive: the server keeps the original master and the
 * session only describes which portions of it to keep. ALL timestamps are
 * integer milliseconds on the ORIGINAL master timeline; nothing here ever
 * re-bases times onto the edited output.
 *
 * Invariants enforced by the reducer after every action:
 * `0 <= trimStartMs < trimEndMs <= durationMs` (integers); cuts are sorted
 * by start, non-overlapping (touching cuts are merged into one), at least
 * 1ms wide, and contained inside the trim window; `selectedCutId` always
 * references an existing cut, or is null; the output duration — trim window
 * minus cut time — never drops below {@link MIN_OUTPUT_MS} (or below the
 * current output for sessions loaded already under the minimum, so recovery
 * edits are still possible).
 *
 * Actions that would violate an invariant are clamped to the nearest valid
 * value rather than rejected, so pointer drags stop at the limit instead of
 * jumping. No-op actions return the previous state reference, which the
 * history wrapper relies on to skip empty entries.
 */

/**
 * Minimum output duration (trim window minus cuts) the reducer preserves.
 */
export const MIN_OUTPUT_MS = 1000;

/**
 * Default half-span of a newly added cut: ADD_CUT removes ±2s around the
 * playhead unless the caller overrides it.
 */
export const DEFAULT_CUT_HALF_SPAN_MS = 2000;

/**
 * A removed range on the original master timeline.
 */
export interface CutRange {
	/** Stable identifier, unique within the session. */
	id: string;
	/** Inclusive start of the removed range, in master-timeline ms. */
	startMs: number;
	/** Exclusive end of the removed range, in master-timeline ms. */
	endMs: number;
}

/**
 * The full editing state for one video.
 */
export interface EditSession {
	/** Duration of the original master, in ms. */
	durationMs: number;
	/** Start of the kept window, in master-timeline ms. */
	trimStartMs: number;
	/** End of the kept window, in master-timeline ms. */
	trimEndMs: number;
	/** Sorted, non-overlapping cuts inside the trim window. */
	cuts: CutRange[];
	/** Currently selected cut, or null. */
	selectedCutId: string | null;
}

/**
 * Serialized trim operation, as exchanged with the server.
 */
export interface TrimOperation {
	type: 'trim';
	start_ms: number;
	end_ms: number;
}

/**
 * Serialized cut operation, as exchanged with the server.
 */
export interface CutOperation {
	type: 'cut';
	start_ms: number;
	end_ms: number;
}

/**
 * Any serialized edit operation.
 */
export type EditOperation = TrimOperation | CutOperation;

/**
 * Actions understood by {@link editSessionReducer}.
 */
export type EditSessionAction =
	| { type: 'SET_TRIM_START'; ms: number }
	| { type: 'SET_TRIM_END'; ms: number }
	| { type: 'ADD_CUT'; atMs: number; halfSpanMs?: number; id?: string }
	| { type: 'UPDATE_CUT'; id: string; startMs?: number; endMs?: number }
	| { type: 'MOVE_CUT'; id: string; startMs: number }
	| { type: 'REMOVE_CUT'; id: string }
	| { type: 'SELECT_CUT'; id: string | null }
	| { type: 'LOAD'; operations: EditOperation[]; durationMs: number }
	| { type: 'RESET' };

let cutIdCounter = 0;

/**
 * Generate a session-unique cut id.
 *
 * @return A fresh cut id.
 */
function nextCutId(): string {
	cutIdCounter++;
	return `cut-${ cutIdCounter }`;
}

/**
 * Clamp a value into [min, max] and round it to an integer.
 *
 * @param value - Raw value.
 * @param min   - Lower bound.
 * @param max   - Upper bound.
 * @return The clamped integer.
 */
function clampInt( value: number, min: number, max: number ): number {
	return Math.min( max, Math.max( min, Math.round( value ) ) );
}

/**
 * Sum of removed time: the union of the given ranges intersected with the
 * window. Overlapping input ranges are not double-counted.
 *
 * @param ranges  - Candidate cut ranges (any order, may overlap).
 * @param startMs - Window start.
 * @param endMs   - Window end.
 * @return Total removed ms within the window.
 */
function removedWithinWindow(
	ranges: { startMs: number; endMs: number }[],
	startMs: number,
	endMs: number
): number {
	const sorted = [ ...ranges ].sort( ( a, b ) => a.startMs - b.startMs );
	let removed = 0;
	let cursor = startMs;
	for ( const range of sorted ) {
		const from = Math.max( range.startMs, cursor );
		const to = Math.min( range.endMs, endMs );
		if ( to > from ) {
			removed += to - from;
			cursor = to;
		}
	}
	return removed;
}

/**
 * Output duration for a hypothetical trim window and cut list.
 *
 * @param trimStartMs - Window start.
 * @param trimEndMs   - Window end.
 * @param cuts        - Cut ranges (may overlap; union is used).
 * @return Kept ms after trims and cuts.
 */
function outputDuration(
	trimStartMs: number,
	trimEndMs: number,
	cuts: { startMs: number; endMs: number }[]
): number {
	return trimEndMs - trimStartMs - removedWithinWindow( cuts, trimStartMs, trimEndMs );
}

/**
 * Output duration of a session: the trim window minus cut time.
 *
 * @param session - The session to measure.
 * @return Kept ms after trims and cuts.
 */
export function getOutputDurationMs( session: EditSession ): number {
	return outputDuration( session.trimStartMs, session.trimEndMs, session.cuts );
}

/**
 * The minimum output the next action must preserve. Normally
 * {@link MIN_OUTPUT_MS}, but never more than the current output so sessions
 * loaded already under the minimum can still be edited toward recovery.
 *
 * @param session - Current session.
 * @return Required minimum output in ms (at least 1).
 */
function requiredMinOutput( session: EditSession ): number {
	return Math.max( 1, Math.min( MIN_OUTPUT_MS, getOutputDurationMs( session ) ) );
}

/**
 * Largest integer x in [lo, hi] satisfying `pred`, assuming `pred` is
 * monotone true→false as x grows.
 *
 * @param lo   - Lower bound (inclusive).
 * @param hi   - Upper bound (inclusive).
 * @param pred - Monotone predicate.
 * @return The largest satisfying value, or null if `pred( lo )` is false.
 */
function largestSatisfying(
	lo: number,
	hi: number,
	pred: ( x: number ) => boolean
): number | null {
	if ( pred( hi ) ) {
		return hi;
	}
	if ( ! pred( lo ) ) {
		return null;
	}
	let good = lo;
	let bad = hi;
	while ( bad - good > 1 ) {
		const mid = Math.floor( ( good + bad ) / 2 );
		if ( pred( mid ) ) {
			good = mid;
		} else {
			bad = mid;
		}
	}
	return good;
}

/**
 * Smallest integer x in [lo, hi] satisfying `pred`, assuming `pred` is
 * monotone false→true as x grows.
 *
 * @param lo   - Lower bound (inclusive).
 * @param hi   - Upper bound (inclusive).
 * @param pred - Monotone predicate.
 * @return The smallest satisfying value, or null if `pred( hi )` is false.
 */
function smallestSatisfying(
	lo: number,
	hi: number,
	pred: ( x: number ) => boolean
): number | null {
	if ( pred( lo ) ) {
		return lo;
	}
	if ( ! pred( hi ) ) {
		return null;
	}
	let bad = lo;
	let good = hi;
	while ( good - bad > 1 ) {
		const mid = Math.floor( ( bad + good ) / 2 );
		if ( pred( mid ) ) {
			good = mid;
		} else {
			bad = mid;
		}
	}
	return good;
}

/**
 * Clamp cuts into the trim window, dropping any that end up empty.
 *
 * @param cuts        - Cuts to clip.
 * @param trimStartMs - Window start.
 * @param trimEndMs   - Window end.
 * @return Clipped cuts (order preserved).
 */
function clipCutsToWindow( cuts: CutRange[], trimStartMs: number, trimEndMs: number ): CutRange[] {
	const clipped: CutRange[] = [];
	for ( const cut of cuts ) {
		const startMs = Math.max( cut.startMs, trimStartMs );
		const endMs = Math.min( cut.endMs, trimEndMs );
		if ( endMs > startMs ) {
			clipped.push(
				startMs === cut.startMs && endMs === cut.endMs ? cut : { ...cut, startMs, endMs }
			);
		}
	}
	return clipped;
}

/**
 * Sort cuts and merge overlapping or touching neighbors into single ranges.
 *
 * @param cuts     - Cuts to normalize.
 * @param chooseId - Picks the surviving id for a merged group from its
 *                 member ids (in start order). Defaults to the first.
 * @return Sorted, non-overlapping cuts.
 */
function mergeCuts(
	cuts: CutRange[],
	chooseId: ( memberIds: string[] ) => string = ids => ids[ 0 ]
): CutRange[] {
	const sorted = [ ...cuts ].sort( ( a, b ) => a.startMs - b.startMs || a.endMs - b.endMs );
	const merged: CutRange[] = [];
	let group: { startMs: number; endMs: number; ids: string[] } | null = null;

	const flush = () => {
		if ( group ) {
			merged.push( { id: chooseId( group.ids ), startMs: group.startMs, endMs: group.endMs } );
			group = null;
		}
	};

	for ( const cut of sorted ) {
		if ( group && cut.startMs <= group.endMs ) {
			group.endMs = Math.max( group.endMs, cut.endMs );
			group.ids.push( cut.id );
		} else {
			flush();
			group = { startMs: cut.startMs, endMs: cut.endMs, ids: [ cut.id ] };
		}
	}
	flush();
	return merged;
}

/**
 * Resolve the selection against the next cut list: keep it when it still
 * exists, fall back to `fallbackId` (e.g. the cut that absorbed it in a
 * merge), else clear it.
 *
 * @param cuts       - Next cut list.
 * @param selectedId - Previously selected id.
 * @param fallbackId - Id to select when the previous one is gone.
 * @return The normalized selected id or null.
 */
function normalizeSelection(
	cuts: CutRange[],
	selectedId: string | null,
	fallbackId?: string
): string | null {
	if ( selectedId !== null && cuts.some( cut => cut.id === selectedId ) ) {
		return selectedId;
	}
	if ( fallbackId !== undefined && cuts.some( cut => cut.id === fallbackId ) ) {
		return fallbackId;
	}
	return null;
}

/**
 * Structural equality of the persistable edit state of two sessions —
 * everything except the selection. This is the history-relevant comparison:
 * the undo/redo wrapper uses it so selection-only changes and gestures that
 * return to their exact start never consume undo entries.
 *
 * @param a - One session.
 * @param b - Another session.
 * @return Whether the sessions describe the same edits.
 */
export function sessionEditsEqual( a: EditSession, b: EditSession ): boolean {
	return (
		a.durationMs === b.durationMs &&
		a.trimStartMs === b.trimStartMs &&
		a.trimEndMs === b.trimEndMs &&
		a.cuts.length === b.cuts.length &&
		a.cuts.every(
			( cut, i ) =>
				cut.id === b.cuts[ i ].id &&
				cut.startMs === b.cuts[ i ].startMs &&
				cut.endMs === b.cuts[ i ].endMs
		)
	);
}

/**
 * Full structural equality of two sessions (edits AND selection), used to
 * return the previous reference on no-op actions.
 *
 * @param a - One session.
 * @param b - Another session.
 * @return Whether the sessions are structurally identical.
 */
function sessionsEqual( a: EditSession, b: EditSession ): boolean {
	return a.selectedCutId === b.selectedCutId && sessionEditsEqual( a, b );
}

/**
 * Create a pristine session covering the full master.
 *
 * @param durationMs - Master duration in ms.
 * @return A full-range session with no cuts.
 */
export function createEditSession( durationMs: number ): EditSession {
	const duration = Math.max( 0, Math.round( durationMs ) );
	return {
		durationMs: duration,
		trimStartMs: 0,
		trimEndMs: duration,
		cuts: [],
		selectedCutId: null,
	};
}

/**
 * Build a session from serialized operations. Invalid input is normalized:
 * cuts are rounded, clipped to the trim window, sorted, and merged; a
 * degenerate trim falls back to the full range. The minimum-output rule is
 * an interaction constraint, so it is NOT applied to loaded data — the
 * session must reflect what the server has.
 *
 * @param operations - Serialized operations.
 * @param durationMs - Master duration in ms.
 * @return The loaded session.
 */
function sessionFromOperations( operations: EditOperation[], durationMs: number ): EditSession {
	const duration = Math.max( 0, Math.round( durationMs ) );
	const trimOp = operations.find( ( op ): op is TrimOperation => op.type === 'trim' );

	let trimStartMs = 0;
	let trimEndMs = duration;
	if ( trimOp ) {
		trimStartMs = clampInt( trimOp.start_ms, 0, duration );
		trimEndMs = clampInt( trimOp.end_ms, 0, duration );
		if ( trimEndMs <= trimStartMs ) {
			// Degenerate trim: fall back to the full range.
			trimStartMs = 0;
			trimEndMs = duration;
		}
	}

	const rawCuts: CutRange[] = operations
		.filter( ( op ): op is CutOperation => op.type === 'cut' )
		.map( op => ( {
			id: nextCutId(),
			startMs: Math.round( op.start_ms ),
			endMs: Math.round( op.end_ms ),
		} ) );

	return {
		durationMs: duration,
		trimStartMs,
		trimEndMs,
		cuts: mergeCuts( clipCutsToWindow( rawCuts, trimStartMs, trimEndMs ) ),
		selectedCutId: null,
	};
}

/**
 * Move the trim start, clamped so the output never drops below the required
 * minimum. Cuts falling outside the new window are clipped or dropped.
 *
 * @param state - Current session.
 * @param ms    - Requested trim start.
 * @return Next session.
 */
function setTrimStart( state: EditSession, ms: number ): EditSession {
	const requested = clampInt( ms, 0, state.trimEndMs );
	const minOutput = requiredMinOutput( state );
	const pred = ( t: number ) => outputDuration( t, state.trimEndMs, state.cuts ) >= minOutput;
	const trimStartMs = largestSatisfying( 0, requested, pred ) ?? state.trimStartMs;
	const cuts = mergeCuts( clipCutsToWindow( state.cuts, trimStartMs, state.trimEndMs ) );
	return {
		...state,
		trimStartMs,
		cuts,
		selectedCutId: normalizeSelection( cuts, state.selectedCutId ),
	};
}

/**
 * Move the trim end, clamped so the output never drops below the required
 * minimum. Cuts falling outside the new window are clipped or dropped.
 *
 * @param state - Current session.
 * @param ms    - Requested trim end.
 * @return Next session.
 */
function setTrimEnd( state: EditSession, ms: number ): EditSession {
	const requested = clampInt( ms, state.trimStartMs, state.durationMs );
	const minOutput = requiredMinOutput( state );
	const pred = ( t: number ) => outputDuration( state.trimStartMs, t, state.cuts ) >= minOutput;
	const trimEndMs = smallestSatisfying( requested, state.durationMs, pred ) ?? state.trimEndMs;
	const cuts = mergeCuts( clipCutsToWindow( state.cuts, state.trimStartMs, trimEndMs ) );
	return {
		...state,
		trimEndMs,
		cuts,
		selectedCutId: normalizeSelection( cuts, state.selectedCutId ),
	};
}

/**
 * Add a cut around the playhead. The span is clamped to the trim window,
 * merged with any overlapping/touching cuts, and shrunk symmetrically if the
 * full span would push the output under the required minimum. A playhead
 * outside the trim window is a no-op.
 *
 * @param state      - Current session.
 * @param atMs       - Playhead position on the master timeline.
 * @param halfSpanMs - Half-span of the new cut (default ±2s).
 * @param id         - Explicit id for the new cut (tests/UI).
 * @return Next session.
 */
function addCut( state: EditSession, atMs: number, halfSpanMs?: number, id?: string ): EditSession {
	const at = Math.round( atMs );
	if ( at < state.trimStartMs || at > state.trimEndMs ) {
		return state;
	}
	const maxHalf = Math.max( 1, Math.round( halfSpanMs ?? DEFAULT_CUT_HALF_SPAN_MS ) );
	const minOutput = requiredMinOutput( state );

	const candidateRange = ( half: number ) => ( {
		startMs: Math.max( state.trimStartMs, at - half ),
		endMs: Math.min( state.trimEndMs, at + half ),
	} );
	const pred = ( half: number ) =>
		outputDuration( state.trimStartMs, state.trimEndMs, [
			...state.cuts,
			candidateRange( half ),
		] ) >= minOutput;

	const half = largestSatisfying( 1, maxHalf, pred );
	if ( half === null ) {
		return state;
	}
	const range = candidateRange( half );
	if ( range.endMs <= range.startMs ) {
		return state;
	}

	const newId = id ?? nextCutId();
	// A cut that merely grows an existing cut keeps the existing id.
	const chooseId = ( memberIds: string[] ) => memberIds.find( m => m !== newId ) ?? newId;
	const cuts = mergeCuts( [ ...state.cuts, { id: newId, ...range } ], chooseId );
	const containing = cuts.find( cut => cut.startMs <= at && at <= cut.endMs );
	return {
		...state,
		cuts,
		selectedCutId: containing ? containing.id : normalizeSelection( cuts, state.selectedCutId ),
	};
}

/**
 * Move one or both edges of a cut. Edges are clamped to the trim window and
 * to a 1ms minimum width; overlapping neighbors are merged into the dragged
 * cut (which keeps its id); a single dragged edge is clamped back so the
 * output never drops below the required minimum.
 *
 * @param state   - Current session.
 * @param id      - Id of the cut being updated.
 * @param startMs - New start edge, if moved.
 * @param endMs   - New end edge, if moved.
 * @return Next session.
 */
function updateCut(
	state: EditSession,
	id: string,
	startMs?: number,
	endMs?: number
): EditSession {
	const cut = state.cuts.find( c => c.id === id );
	if ( ! cut || ( startMs === undefined && endMs === undefined ) ) {
		return state;
	}
	let nextStart =
		startMs === undefined ? cut.startMs : clampInt( startMs, state.trimStartMs, state.trimEndMs );
	let nextEnd =
		endMs === undefined ? cut.endMs : clampInt( endMs, state.trimStartMs, state.trimEndMs );

	// Keep at least 1ms of width by pushing back the edge that moved.
	if ( nextEnd <= nextStart ) {
		if ( startMs !== undefined && endMs === undefined ) {
			nextStart = nextEnd - 1;
		} else {
			nextEnd = nextStart + 1;
		}
		if ( nextStart < state.trimStartMs || nextEnd > state.trimEndMs ) {
			return state;
		}
	}

	const others = state.cuts.filter( c => c.id !== id );
	const minOutput = requiredMinOutput( state );
	const output = ( range: { startMs: number; endMs: number } ) =>
		outputDuration( state.trimStartMs, state.trimEndMs, [ ...others, range ] );

	if ( output( { startMs: nextStart, endMs: nextEnd } ) < minOutput ) {
		if ( startMs !== undefined && endMs === undefined ) {
			// Growing leftward: find the leftmost allowed start.
			const clamped = smallestSatisfying(
				nextStart,
				cut.startMs,
				s => output( { startMs: s, endMs: nextEnd } ) >= minOutput
			);
			if ( clamped === null ) {
				return state;
			}
			nextStart = clamped;
		} else if ( endMs !== undefined && startMs === undefined ) {
			// Growing rightward: find the rightmost allowed end.
			const clamped = largestSatisfying(
				cut.endMs,
				nextEnd,
				e => output( { startMs: nextStart, endMs: e } ) >= minOutput
			);
			if ( clamped === null ) {
				return state;
			}
			nextEnd = clamped;
		} else {
			// Both edges moved past the limit at once: reject.
			return state;
		}
	}

	const chooseId = ( memberIds: string[] ) => ( memberIds.includes( id ) ? id : memberIds[ 0 ] );
	const cuts = mergeCuts( [ ...others, { id, startMs: nextStart, endMs: nextEnd } ], chooseId );
	return {
		...state,
		cuts,
		selectedCutId: normalizeSelection( cuts, state.selectedCutId, id ),
	};
}

/**
 * Move a whole cut, preserving its width. The start is clamped so the cut
 * stays inside the trim window; overlapping/touching neighbors are merged
 * into the dragged cut (which keeps its id). The moved cut becomes the
 * selection: the only way to move one is to grab it, and body-drag moves are
 * replayed from the gesture's base state, whose pre-gesture selection must
 * not reassert itself mid-drag.
 *
 * No minimum-output clamp is needed: a width-preserving move can only SHRINK
 * the removed union — the moved cut removes exactly as much as before unless
 * it lands on another cut, in which case the union loses the overlap — so
 * the output duration never decreases.
 *
 * @param state   - Current session.
 * @param id      - Id of the cut being moved.
 * @param startMs - Requested new start; the end follows at start + width.
 * @return Next session.
 */
function moveCut( state: EditSession, id: string, startMs: number ): EditSession {
	const cut = state.cuts.find( c => c.id === id );
	if ( ! cut ) {
		return state;
	}
	const width = cut.endMs - cut.startMs;
	// Cuts are contained in the trim window, so width <= trimEnd - trimStart
	// and this clamp range is never inverted.
	const nextStart = clampInt( startMs, state.trimStartMs, state.trimEndMs - width );

	const others = state.cuts.filter( c => c.id !== id );
	const chooseId = ( memberIds: string[] ) => ( memberIds.includes( id ) ? id : memberIds[ 0 ] );
	const cuts = mergeCuts(
		[ ...others, { id, startMs: nextStart, endMs: nextStart + width } ],
		chooseId
	);
	// The moved cut always survives a merge (its group's chooseId keeps it),
	// so selecting it unconditionally never dangles.
	return {
		...state,
		cuts,
		selectedCutId: id,
	};
}

/**
 * The edit-session reducer. Enforces every invariant documented on
 * {@link EditSession}; returns the previous state reference for no-ops.
 *
 * @param state  - Current session.
 * @param action - Action to apply.
 * @return Next session.
 */
export function editSessionReducer( state: EditSession, action: EditSessionAction ): EditSession {
	let next: EditSession;

	switch ( action.type ) {
		case 'SET_TRIM_START':
			next = setTrimStart( state, action.ms );
			break;

		case 'SET_TRIM_END':
			next = setTrimEnd( state, action.ms );
			break;

		case 'ADD_CUT':
			next = addCut( state, action.atMs, action.halfSpanMs, action.id );
			break;

		case 'UPDATE_CUT':
			next = updateCut( state, action.id, action.startMs, action.endMs );
			break;

		case 'MOVE_CUT':
			next = moveCut( state, action.id, action.startMs );
			break;

		case 'REMOVE_CUT': {
			const cuts = state.cuts.filter( cut => cut.id !== action.id );
			if ( cuts.length === state.cuts.length ) {
				return state;
			}
			next = { ...state, cuts, selectedCutId: normalizeSelection( cuts, state.selectedCutId ) };
			break;
		}

		case 'SELECT_CUT':
			if ( action.id !== null && ! state.cuts.some( cut => cut.id === action.id ) ) {
				return state;
			}
			next = { ...state, selectedCutId: action.id };
			break;

		case 'LOAD':
			next = sessionFromOperations( action.operations, action.durationMs );
			break;

		case 'RESET':
			next = createEditSession( state.durationMs );
			break;

		default:
			return state;
	}

	return sessionsEqual( state, next ) ? state : next;
}

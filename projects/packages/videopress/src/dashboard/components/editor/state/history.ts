/**
 * Generic undo/redo wrapper for a pure reducer.
 *
 * Designed around pointer-drag gestures: while a drag is in flight the UI
 * dispatches `{ type: 'TRANSIENT', action }` updates, which replace the
 * present state without touching history; on pointer-up it dispatches
 * `{ type: 'COMMIT' }`, which pushes exactly ONE undo entry — the state from
 * before the gesture started — no matter how many transient updates ran.
 *
 * Transient updates normally reduce from the current present, so moves within
 * a gesture compound. A transient dispatched with `fromBase: true` instead
 * REPLAYS against the gesture's base snapshot, so each move replaces the
 * gesture's whole effect. That is the correct semantics when an intermediate
 * state is destructive — a drag preview that merges two ranges, say — and a
 * later move reduced from it would compound the destruction instead of
 * revising the preview.
 *
 * Plain (unwrapped) actions push one undo entry each. Actions matching
 * `options.clearOn` (e.g. LOAD/RESET) apply and wipe both stacks. The past
 * stack is capped (oldest entries dropped) at `options.limit`, default
 * {@link HISTORY_LIMIT}.
 *
 * The inner reducer MUST return the previous state reference for no-op
 * actions — that is how this wrapper avoids recording empty history entries.
 * `options.equals` extends that to STRUCTURAL no-ops the reference check
 * can't see: a gesture that ends exactly where it started commits nothing,
 * and a plain action whose result is history-equivalent to the present (e.g.
 * a selection change, when `equals` ignores selection) replaces the present
 * without consuming an undo entry or clearing the redo stack.
 */

/**
 * Default cap on the number of undo entries.
 */
export const HISTORY_LIMIT = 100;

/**
 * History-wrapped state.
 */
export interface HistoryState< S > {
	/** Undo stack, oldest first. */
	past: S[];
	/** Current state. */
	present: S;
	/** Redo stack, nearest first. */
	future: S[];
	/** Pre-gesture snapshot while transient updates are in flight, else null. */
	transientBase: S | null;
}

/**
 * Actions understood by a history-wrapped reducer: the inner actions plus
 * the history controls. Inner action types must not collide with
 * UNDO/REDO/COMMIT/TRANSIENT.
 */
export type HistoryAction< A extends { type: string } > =
	| { type: 'UNDO' }
	| { type: 'REDO' }
	| { type: 'COMMIT' }
	| { type: 'TRANSIENT'; action: A; fromBase?: boolean }
	| A;

/**
 * Options for {@link withHistory}.
 */
export interface WithHistoryOptions< S, A > {
	/** Max undo entries kept; oldest are dropped. Default {@link HISTORY_LIMIT}. */
	limit?: number;
	/** Actions that apply and then clear all history (e.g. LOAD/RESET). */
	clearOn?: ( action: A ) => boolean;
	/**
	 * History-relevant structural equality. States that compare equal never
	 * produce an undo entry: a committed gesture that returned to its start is
	 * dropped, and a plain action whose result is equal to the present (a
	 * selection-only change, say) updates the present without touching the
	 * stacks. Defaults to reference equality.
	 */
	equals?: ( a: S, b: S ) => boolean;
}

/**
 * Create an initial history state around a present value.
 *
 * @param present - The initial state.
 * @return A history state with empty stacks.
 */
export function createHistory< S >( present: S ): HistoryState< S > {
	return { past: [], present, future: [], transientBase: null };
}

/**
 * Whether an undo entry is available.
 *
 * @param state  - History state.
 * @param equals - History-relevant equality; pass the same function given to
 *               {@link withHistory} so a gesture parked back on its start
 *               doesn't advertise an undo that would change nothing.
 * @return True when UNDO would change the present.
 */
export function canUndo< S >(
	state: HistoryState< S >,
	equals: ( a: S, b: S ) => boolean = ( a, b ) => a === b
): boolean {
	return (
		state.past.length > 0 ||
		( state.transientBase !== null && ! equals( state.transientBase, state.present ) )
	);
}

/**
 * Whether a redo entry is available.
 *
 * @param state - History state.
 * @return True when REDO would change the present.
 */
export function canRedo< S >( state: HistoryState< S > ): boolean {
	return state.future.length > 0;
}

/**
 * Wrap a pure reducer with undo/redo and gesture-coalescing history.
 *
 * @param reducer - The inner reducer. Must return the same reference for no-ops.
 * @param options - Cap and clear-on configuration.
 * @return A reducer over {@link HistoryState} accepting {@link HistoryAction}.
 */
export function withHistory< S, A extends { type: string } >(
	reducer: ( state: S, action: A ) => S,
	options: WithHistoryOptions< S, A > = {}
): ( state: HistoryState< S >, action: HistoryAction< A > ) => HistoryState< S > {
	const limit = options.limit ?? HISTORY_LIMIT;
	const clearOn = options.clearOn;
	const equals = options.equals ?? ( ( a: S, b: S ) => a === b );

	const pushEntry = ( past: S[], entry: S ): S[] => [ ...past, entry ].slice( -limit );

	// Fold a pending gesture into a single undo entry, if one is in flight.
	// Structural equality matters here: a drag that wanders and returns to its
	// exact start produces a new reference equal to the base — committing it
	// would push a no-op undo entry and wipe the redo stack.
	const commitPending = ( state: HistoryState< S > ): HistoryState< S > => {
		if ( state.transientBase === null ) {
			return state;
		}
		if ( equals( state.transientBase, state.present ) ) {
			return { ...state, transientBase: null };
		}
		return {
			past: pushEntry( state.past, state.transientBase ),
			present: state.present,
			future: [],
			transientBase: null,
		};
	};

	const applyCleared = ( state: HistoryState< S >, action: A ): HistoryState< S > => {
		const present = reducer( state.present, action );
		if (
			present === state.present &&
			state.past.length === 0 &&
			state.future.length === 0 &&
			state.transientBase === null
		) {
			return state;
		}
		return { past: [], present, future: [], transientBase: null };
	};

	return ( state, action ) => {
		switch ( action.type ) {
			case 'UNDO': {
				const committed = commitPending( state );
				if ( committed.past.length === 0 ) {
					return committed;
				}
				const previous = committed.past[ committed.past.length - 1 ];
				return {
					past: committed.past.slice( 0, -1 ),
					present: previous,
					future: [ committed.present, ...committed.future ],
					transientBase: null,
				};
			}

			case 'REDO': {
				const committed = commitPending( state );
				if ( committed.future.length === 0 ) {
					return committed;
				}
				const [ next, ...rest ] = committed.future;
				return {
					past: pushEntry( committed.past, committed.present ),
					present: next,
					future: rest,
					transientBase: null,
				};
			}

			case 'COMMIT':
				return commitPending( state );

			case 'TRANSIENT': {
				const { action: inner, fromBase } = action as {
					type: 'TRANSIENT';
					action: A;
					fromBase?: boolean;
				};
				if ( clearOn && clearOn( inner ) ) {
					return applyCleared( state, inner );
				}
				// A from-base transient replays against the gesture's snapshot
				// (falling back to the present when no gesture is in flight yet),
				// so destructive intermediate previews never compound.
				const base = fromBase ? state.transientBase ?? state.present : state.present;
				const present = reducer( base, inner );
				if ( present === state.present ) {
					return state;
				}
				return {
					...state,
					present,
					transientBase: state.transientBase ?? state.present,
				};
			}

			default: {
				const inner = action as A;
				if ( clearOn && clearOn( inner ) ) {
					return applyCleared( state, inner );
				}
				const present = reducer( state.present, inner );
				if ( present === state.present ) {
					return state;
				}
				// History-equivalent result (e.g. a selection-only change when
				// `equals` ignores selection): update the present without
				// consuming an undo entry or clearing the redo stack.
				if ( equals( present, state.present ) ) {
					return { ...state, present };
				}
				// Coalesce any pending gesture into this entry.
				const entry = state.transientBase ?? state.present;
				return {
					past: pushEntry( state.past, entry ),
					present,
					future: [],
					transientBase: null,
				};
			}
		}
	};
}

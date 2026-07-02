/**
 * Generic undo/redo wrapper for a pure reducer.
 *
 * Designed around pointer-drag gestures: while a drag is in flight the UI
 * dispatches `{ type: 'TRANSIENT', action }` updates, which replace the
 * present state without touching history; on pointer-up it dispatches
 * `{ type: 'COMMIT' }`, which pushes exactly ONE undo entry — the state from
 * before the gesture started — no matter how many transient updates ran.
 *
 * Plain (unwrapped) actions push one undo entry each. Actions matching
 * `options.clearOn` (e.g. LOAD/RESET) apply and wipe both stacks. The past
 * stack is capped (oldest entries dropped) at `options.limit`, default
 * {@link HISTORY_LIMIT}.
 *
 * The inner reducer MUST return the previous state reference for no-op
 * actions — that is how this wrapper avoids recording empty history entries.
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
	| { type: 'TRANSIENT'; action: A }
	| A;

/**
 * Options for {@link withHistory}.
 */
export interface WithHistoryOptions< A > {
	/** Max undo entries kept; oldest are dropped. Default {@link HISTORY_LIMIT}. */
	limit?: number;
	/** Actions that apply and then clear all history (e.g. LOAD/RESET). */
	clearOn?: ( action: A ) => boolean;
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
 * @param state - History state.
 * @return True when UNDO would change the present.
 */
export function canUndo< S >( state: HistoryState< S > ): boolean {
	return (
		state.past.length > 0 ||
		( state.transientBase !== null && state.transientBase !== state.present )
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
	options: WithHistoryOptions< A > = {}
): ( state: HistoryState< S >, action: HistoryAction< A > ) => HistoryState< S > {
	const limit = options.limit ?? HISTORY_LIMIT;
	const clearOn = options.clearOn;

	const pushEntry = ( past: S[], entry: S ): S[] => [ ...past, entry ].slice( -limit );

	// Fold a pending gesture into a single undo entry, if one is in flight.
	const commitPending = ( state: HistoryState< S > ): HistoryState< S > => {
		if ( state.transientBase === null ) {
			return state;
		}
		if ( state.transientBase === state.present ) {
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
				const inner = ( action as { type: 'TRANSIENT'; action: A } ).action;
				if ( clearOn && clearOn( inner ) ) {
					return applyCleared( state, inner );
				}
				const present = reducer( state.present, inner );
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

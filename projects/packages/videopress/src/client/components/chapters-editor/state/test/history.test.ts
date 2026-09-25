import { canRedo, canUndo, createHistory, withHistory, HISTORY_LIMIT } from '../history';
import type { HistoryState } from '../history';

interface CounterState {
	value: number;
}

type CounterAction =
	| { type: 'SET'; value: number }
	| { type: 'INC' }
	| { type: 'LOAD'; value: number }
	| { type: 'RESET' };

/**
 * Minimal inner reducer: returns the same reference for no-ops, like the
 * edit-session reducer does.
 *
 * @param state  - Current counter state.
 * @param action - Action to apply.
 * @return Next counter state.
 */
function counterReducer( state: CounterState, action: CounterAction ): CounterState {
	switch ( action.type ) {
		case 'SET':
			return state.value === action.value ? state : { value: action.value };
		case 'INC':
			return { value: state.value + 1 };
		case 'LOAD':
			return { value: action.value };
		case 'RESET':
			return state.value === 0 ? state : { value: 0 };
		default:
			return state;
	}
}

const isClearAction = ( action: CounterAction ) =>
	action.type === 'LOAD' || action.type === 'RESET';

const reducer = withHistory( counterReducer, { clearOn: isClearAction } );

const start = (): HistoryState< CounterState > => createHistory( { value: 0 } );

describe( 'createHistory', () => {
	it( 'wraps the present with empty stacks', () => {
		expect( start() ).toEqual( {
			past: [],
			present: { value: 0 },
			future: [],
			transientBase: null,
		} );
	} );
} );

describe( 'plain actions', () => {
	it( 'push one undo entry per action', () => {
		let h = start();
		h = reducer( h, { type: 'INC' } );
		h = reducer( h, { type: 'INC' } );
		expect( h.present ).toEqual( { value: 2 } );
		expect( h.past ).toEqual( [ { value: 0 }, { value: 1 } ] );
		expect( h.future ).toEqual( [] );
	} );

	it( 'return the same reference for a no-op action', () => {
		const h = start();
		expect( reducer( h, { type: 'SET', value: 0 } ) ).toBe( h );
	} );

	it( 'clear the redo stack', () => {
		let h = start();
		h = reducer( h, { type: 'INC' } );
		h = reducer( h, { type: 'UNDO' } );
		expect( h.future ).toHaveLength( 1 );
		h = reducer( h, { type: 'SET', value: 9 } );
		expect( h.future ).toEqual( [] );
	} );
} );

describe( 'UNDO / REDO', () => {
	it( 'undo restores the previous state and redo reapplies it', () => {
		let h = start();
		h = reducer( h, { type: 'SET', value: 5 } );
		h = reducer( h, { type: 'SET', value: 9 } );

		h = reducer( h, { type: 'UNDO' } );
		expect( h.present ).toEqual( { value: 5 } );
		expect( h.future ).toEqual( [ { value: 9 } ] );

		h = reducer( h, { type: 'REDO' } );
		expect( h.present ).toEqual( { value: 9 } );
		expect( h.future ).toEqual( [] );
	} );

	it( 'undo on an empty past is a no-op', () => {
		const h = start();
		expect( reducer( h, { type: 'UNDO' } ) ).toBe( h );
	} );

	it( 'redo on an empty future is a no-op', () => {
		const h = start();
		expect( reducer( h, { type: 'REDO' } ) ).toBe( h );
	} );

	it( 'walks all the way back and forward again', () => {
		let h = start();
		for ( let i = 1; i <= 4; i++ ) {
			h = reducer( h, { type: 'INC' } );
		}
		for ( let i = 0; i < 4; i++ ) {
			h = reducer( h, { type: 'UNDO' } );
		}
		expect( h.present ).toEqual( { value: 0 } );
		expect( canUndo( h ) ).toBe( false );
		for ( let i = 0; i < 4; i++ ) {
			h = reducer( h, { type: 'REDO' } );
		}
		expect( h.present ).toEqual( { value: 4 } );
		expect( canRedo( h ) ).toBe( false );
	} );
} );

describe( 'history cap', () => {
	it( 'caps the past at the default limit, dropping the oldest entries', () => {
		let h = start();
		for ( let i = 0; i < HISTORY_LIMIT + 5; i++ ) {
			h = reducer( h, { type: 'INC' } );
		}
		expect( h.past ).toHaveLength( HISTORY_LIMIT );
		expect( h.present ).toEqual( { value: HISTORY_LIMIT + 5 } );
		expect( h.past[ 0 ] ).toEqual( { value: 5 } );

		for ( let i = 0; i < HISTORY_LIMIT; i++ ) {
			h = reducer( h, { type: 'UNDO' } );
		}
		expect( h.present ).toEqual( { value: 5 } );
		expect( canUndo( h ) ).toBe( false );
	} );

	it( 'honors a custom limit', () => {
		const capped = withHistory( counterReducer, { limit: 3 } );
		let h = start();
		for ( let i = 0; i < 5; i++ ) {
			h = capped( h, { type: 'INC' } );
		}
		expect( h.past.map( s => s.value ) ).toEqual( [ 2, 3, 4 ] );
	} );
} );

describe( 'TRANSIENT / COMMIT gestures', () => {
	it( 'transient updates replace the present without touching the past', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 3 } } );
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 7 } } );
		expect( h.present ).toEqual( { value: 7 } );
		expect( h.past ).toEqual( [] );
		expect( h.transientBase ).toEqual( { value: 0 } );
	} );

	it( 'commit pushes exactly one entry for the whole gesture', () => {
		let h = start();
		for ( const value of [ 2, 4, 6, 8 ] ) {
			h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value } } );
		}
		h = reducer( h, { type: 'COMMIT' } );
		expect( h.past ).toEqual( [ { value: 0 } ] );
		expect( h.present ).toEqual( { value: 8 } );
		expect( h.transientBase ).toBeNull();

		h = reducer( h, { type: 'UNDO' } );
		expect( h.present ).toEqual( { value: 0 } );
	} );

	it( 'commit without a pending gesture is a no-op', () => {
		const h = start();
		expect( reducer( h, { type: 'COMMIT' } ) ).toBe( h );
	} );

	it( 'a second commit after a gesture is a no-op', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 3 } } );
		h = reducer( h, { type: 'COMMIT' } );
		expect( reducer( h, { type: 'COMMIT' } ) ).toBe( h );
	} );

	it( 'a no-op transient neither replaces the present nor opens a gesture', () => {
		const h = start();
		expect( reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 0 } } ) ).toBe( h );
	} );

	it( 'a gesture that returns to its base state commits nothing', () => {
		// Toggle between two fixed references so returning to the start of the
		// gesture restores the exact base reference.
		const A = { value: 0 };
		const B = { value: 1 };
		type ToggleAction = { type: 'A' } | { type: 'B' };
		const toggle = withHistory( ( _state: CounterState, action: ToggleAction ) =>
			action.type === 'A' ? A : B
		);
		let h = createHistory< CounterState >( A );
		h = toggle( h, { type: 'TRANSIENT', action: { type: 'B' } } );
		h = toggle( h, { type: 'TRANSIENT', action: { type: 'A' } } );
		expect( h.present ).toBe( A );
		h = toggle( h, { type: 'COMMIT' } );
		expect( h.past ).toEqual( [] );
		expect( h.transientBase ).toBeNull();
	} );

	it( 'a plain action coalesces a pending gesture into its own entry', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 7 } } );
		h = reducer( h, { type: 'INC' } );
		expect( h.present ).toEqual( { value: 8 } );
		expect( h.past ).toEqual( [ { value: 0 } ] );
		expect( h.transientBase ).toBeNull();

		h = reducer( h, { type: 'UNDO' } );
		expect( h.present ).toEqual( { value: 0 } );
	} );

	it( 'undo mid-gesture commits the gesture first', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		h = reducer( h, { type: 'UNDO' } );
		expect( h.present ).toEqual( { value: 0 } );
		expect( h.future ).toEqual( [ { value: 5 } ] );

		h = reducer( h, { type: 'REDO' } );
		expect( h.present ).toEqual( { value: 5 } );
	} );

	it( 'redo mid-gesture with an empty future just commits', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		h = reducer( h, { type: 'REDO' } );
		expect( h.past ).toEqual( [ { value: 0 } ] );
		expect( h.present ).toEqual( { value: 5 } );
		expect( h.transientBase ).toBeNull();
	} );

	it( 'from-base transients replay against the gesture base, not the previous transient', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', fromBase: true, action: { type: 'INC' } } );
		h = reducer( h, { type: 'TRANSIENT', fromBase: true, action: { type: 'INC' } } );
		// Each INC replays from the base {0}: the present stays 1, not 2.
		expect( h.present ).toEqual( { value: 1 } );
		expect( h.transientBase ).toEqual( { value: 0 } );
		expect( h.past ).toEqual( [] );

		h = reducer( h, { type: 'COMMIT' } );
		expect( h.past ).toEqual( [ { value: 0 } ] );
		expect( h.present ).toEqual( { value: 1 } );
	} );

	it( 'a from-base transient before any gesture reduces from the present', () => {
		let h = start();
		h = reducer( h, { type: 'SET', value: 4 } );
		h = reducer( h, { type: 'TRANSIENT', fromBase: true, action: { type: 'INC' } } );
		expect( h.present ).toEqual( { value: 5 } );
		expect( h.transientBase ).toEqual( { value: 4 } );
	} );

	it( 'a from-base transient landing on the base parks the present there and commits nothing', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', fromBase: true, action: { type: 'SET', value: 5 } } );
		h = reducer( h, { type: 'TRANSIENT', fromBase: true, action: { type: 'SET', value: 0 } } );
		// SET 0 replayed from the base {0} is a reducer no-op, so the present
		// returns to the exact base reference.
		expect( h.present ).toBe( h.transientBase );

		h = reducer( h, { type: 'COMMIT' } );
		expect( h.past ).toEqual( [] );
		expect( h.transientBase ).toBeNull();
	} );
} );

describe( 'structural equality (options.equals)', () => {
	const valueEquals = ( a: CounterState, b: CounterState ) => a.value === b.value;
	const structural = withHistory( counterReducer, { equals: valueEquals } );

	it( 'commits nothing for a gesture that returns to a structurally equal state', () => {
		let h = start();
		h = structural( h, { type: 'INC' } );
		h = structural( h, { type: 'UNDO' } );
		expect( h.future ).toEqual( [ { value: 1 } ] );

		// Drag away and back: the reducer builds a NEW object equal to the
		// gesture's base, so reference equality alone would push a spurious
		// undo entry and wipe the redo stack.
		h = structural( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		h = structural( h, { type: 'TRANSIENT', action: { type: 'SET', value: 0 } } );
		expect( h.present ).not.toBe( h.transientBase );
		h = structural( h, { type: 'COMMIT' } );

		expect( h.past ).toEqual( [] );
		expect( h.future ).toEqual( [ { value: 1 } ] );
		expect( h.transientBase ).toBeNull();
	} );

	it( 'canUndo treats a gesture parked on its start as nothing to undo', () => {
		let h = start();
		h = structural( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		expect( canUndo( h, valueEquals ) ).toBe( true );
		h = structural( h, { type: 'TRANSIENT', action: { type: 'SET', value: 0 } } );
		expect( canUndo( h, valueEquals ) ).toBe( false );
	} );

	it( 'a history-equivalent plain action updates the present without touching the stacks', () => {
		interface SelState {
			value: number;
			selected: string | null;
		}
		type SelAction = { type: 'SELECT'; id: string | null } | { type: 'SET'; value: number };
		const selReducer = ( state: SelState, action: SelAction ): SelState => {
			if ( action.type === 'SELECT' ) {
				return state.selected === action.id ? state : { ...state, selected: action.id };
			}
			return state.value === action.value ? state : { ...state, value: action.value };
		};
		const selHistory = withHistory( selReducer, {
			equals: ( a: SelState, b: SelState ) => a.value === b.value,
		} );

		let h = createHistory< SelState >( { value: 0, selected: null } );
		h = selHistory( h, { type: 'SET', value: 3 } );
		h = selHistory( h, { type: 'UNDO' } );

		h = selHistory( h, { type: 'SELECT', id: 'a' } );
		expect( h.present ).toEqual( { value: 0, selected: 'a' } );
		// No undo entry consumed, and — crucially — the redo stack survives.
		expect( h.past ).toEqual( [] );
		expect( h.future ).toEqual( [ { value: 3, selected: null } ] );
	} );
} );

describe( 'clearOn actions', () => {
	it( 'apply and wipe both stacks', () => {
		let h = start();
		h = reducer( h, { type: 'INC' } );
		h = reducer( h, { type: 'INC' } );
		h = reducer( h, { type: 'UNDO' } );
		h = reducer( h, { type: 'LOAD', value: 42 } );
		expect( h ).toEqual( {
			past: [],
			present: { value: 42 },
			future: [],
			transientBase: null,
		} );
	} );

	it( 'clear even when dispatched as a transient', () => {
		let h = start();
		h = reducer( h, { type: 'INC' } );
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'LOAD', value: 42 } } );
		expect( h.past ).toEqual( [] );
		expect( h.present ).toEqual( { value: 42 } );
	} );

	it( 'discard a pending gesture', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		h = reducer( h, { type: 'RESET' } );
		expect( h.present ).toEqual( { value: 0 } );
		expect( h.transientBase ).toBeNull();
		expect( canUndo( h ) ).toBe( false );
	} );

	it( 'return the same reference when nothing changes and history is empty', () => {
		const h = start();
		expect( reducer( h, { type: 'RESET' } ) ).toBe( h );
	} );
} );

describe( 'canUndo / canRedo', () => {
	it( 'report empty stacks', () => {
		const h = start();
		expect( canUndo( h ) ).toBe( false );
		expect( canRedo( h ) ).toBe( false );
	} );

	it( 'report available entries', () => {
		let h = start();
		h = reducer( h, { type: 'INC' } );
		expect( canUndo( h ) ).toBe( true );
		expect( canRedo( h ) ).toBe( false );
		h = reducer( h, { type: 'UNDO' } );
		expect( canUndo( h ) ).toBe( false );
		expect( canRedo( h ) ).toBe( true );
	} );

	it( 'canUndo is true during a pending gesture', () => {
		let h = start();
		h = reducer( h, { type: 'TRANSIENT', action: { type: 'SET', value: 5 } } );
		expect( canUndo( h ) ).toBe( true );
	} );
} );

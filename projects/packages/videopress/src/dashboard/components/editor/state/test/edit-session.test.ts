import {
	createEditSession,
	editSessionReducer,
	getOutputDurationMs,
	DEFAULT_CUT_HALF_SPAN_MS,
	MIN_OUTPUT_MS,
} from '../edit-session';
import type { EditSession, EditSessionAction } from '../edit-session';

const reduce = ( state: EditSession, action: EditSessionAction ) =>
	editSessionReducer( state, action );

/**
 * Apply a list of actions in order.
 *
 * @param state   - Starting session.
 * @param actions - Actions to apply.
 * @return The final session.
 */
function reduceAll( state: EditSession, actions: EditSessionAction[] ): EditSession {
	return actions.reduce( reduce, state );
}

/**
 * Assert every structural invariant the reducer promises.
 *
 * @param session - Session to check.
 */
function assertInvariants( session: EditSession ) {
	expect( Number.isInteger( session.trimStartMs ) ).toBe( true );
	expect( Number.isInteger( session.trimEndMs ) ).toBe( true );
	expect( session.trimStartMs ).toBeGreaterThanOrEqual( 0 );
	expect( session.trimEndMs ).toBeLessThanOrEqual( session.durationMs );
	expect( session.trimStartMs ).toBeLessThan( session.trimEndMs );

	for ( let i = 0; i < session.cuts.length; i++ ) {
		const cut = session.cuts[ i ];
		expect( Number.isInteger( cut.startMs ) ).toBe( true );
		expect( Number.isInteger( cut.endMs ) ).toBe( true );
		expect( cut.endMs ).toBeGreaterThan( cut.startMs );
		expect( cut.startMs ).toBeGreaterThanOrEqual( session.trimStartMs );
		expect( cut.endMs ).toBeLessThanOrEqual( session.trimEndMs );
		if ( i > 0 ) {
			// Sorted and non-overlapping, with touching neighbors merged.
			expect( cut.startMs ).toBeGreaterThan( session.cuts[ i - 1 ].endMs );
		}
	}

	if ( session.selectedCutId !== null ) {
		expect( session.cuts.some( cut => cut.id === session.selectedCutId ) ).toBe( true );
	}
}

describe( 'createEditSession', () => {
	it( 'creates a pristine full-range session', () => {
		expect( createEditSession( 10000 ) ).toEqual( {
			durationMs: 10000,
			trimStartMs: 0,
			trimEndMs: 10000,
			cuts: [],
			selectedCutId: null,
		} );
	} );

	it( 'rounds a fractional duration', () => {
		expect( createEditSession( 9999.6 ).durationMs ).toBe( 10000 );
		expect( createEditSession( 9999.6 ).trimEndMs ).toBe( 10000 );
	} );

	it( 'clamps a negative duration to zero', () => {
		expect( createEditSession( -5 ).durationMs ).toBe( 0 );
	} );
} );

describe( 'SET_TRIM_START', () => {
	it( 'sets the trim start', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_START', ms: 2000 } );
		expect( s.trimStartMs ).toBe( 2000 );
		expect( s.trimEndMs ).toBe( 10000 );
	} );

	it( 'rounds fractional input to integer ms', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_START', ms: 1999.6 } );
		expect( s.trimStartMs ).toBe( 2000 );
	} );

	it( 'clamps negative input to zero and returns the same reference when nothing changes', () => {
		const initial = createEditSession( 10000 );
		expect( reduce( initial, { type: 'SET_TRIM_START', ms: -50 } ) ).toBe( initial );
	} );

	it( 'clamps to preserve the 1000ms minimum output', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_START', ms: 9500 } );
		expect( s.trimStartMs ).toBe( 9000 );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'clamps input far past the end to the minimum-output limit', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_START', ms: 20000 } );
		expect( s.trimStartMs ).toBe( 9000 );
	} );

	it( 'accounts for cut time when enforcing the minimum output', () => {
		// Cut [8000, 9500] leaves 8500ms of output.
		const withCut = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 8750,
			halfSpanMs: 750,
			id: 'c1',
		} );
		expect( withCut.cuts ).toEqual( [ { id: 'c1', startMs: 8000, endMs: 9500 } ] );

		// trimStart=8000 would leave only 500ms of visible output; 7500 leaves exactly 1000.
		const s = reduce( withCut, { type: 'SET_TRIM_START', ms: 8000 } );
		expect( s.trimStartMs ).toBe( 7500 );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 8000, endMs: 9500 } ] );
	} );

	it( 'clips a cut that straddles the new trim start', () => {
		const withCut = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 3000,
			halfSpanMs: 1000,
			id: 'c1',
		} );
		const s = reduce( withCut, { type: 'SET_TRIM_START', ms: 3000 } );
		expect( s.trimStartMs ).toBe( 3000 );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 3000, endMs: 4000 } ] );
	} );

	it( 'drops a cut left fully outside the window and clears its selection', () => {
		const withCut = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 3000,
			halfSpanMs: 1000,
			id: 'c1',
		} );
		expect( withCut.selectedCutId ).toBe( 'c1' );

		const s = reduce( withCut, { type: 'SET_TRIM_START', ms: 4000 } );
		expect( s.trimStartMs ).toBe( 4000 );
		expect( s.cuts ).toEqual( [] );
		expect( s.selectedCutId ).toBeNull();
	} );

	it( 'can move back left after being clamped', () => {
		const clamped = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_START', ms: 9500 } );
		const s = reduce( clamped, { type: 'SET_TRIM_START', ms: 500 } );
		expect( s.trimStartMs ).toBe( 500 );
	} );
} );

describe( 'SET_TRIM_END', () => {
	it( 'sets the trim end', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_END', ms: 8000 } );
		expect( s.trimEndMs ).toBe( 8000 );
	} );

	it( 'rounds fractional input to integer ms', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_END', ms: 7999.6 } );
		expect( s.trimEndMs ).toBe( 8000 );
	} );

	it( 'clamps input beyond the duration and returns the same reference when unchanged', () => {
		const initial = createEditSession( 10000 );
		expect( reduce( initial, { type: 'SET_TRIM_END', ms: 15000 } ) ).toBe( initial );
	} );

	it( 'clamps to preserve the 1000ms minimum output', () => {
		const s = reduce( createEditSession( 10000 ), { type: 'SET_TRIM_END', ms: 500 } );
		expect( s.trimEndMs ).toBe( 1000 );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'accounts for cut time when enforcing the minimum output', () => {
		// Cut [500, 2000].
		const withCut = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 1250,
			halfSpanMs: 750,
			id: 'c1',
		} );
		expect( withCut.cuts ).toEqual( [ { id: 'c1', startMs: 500, endMs: 2000 } ] );

		// trimEnd=2400 would leave 900ms visible; 2500 leaves exactly 1000.
		const s = reduce( withCut, { type: 'SET_TRIM_END', ms: 2400 } );
		expect( s.trimEndMs ).toBe( 2500 );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 500, endMs: 2000 } ] );
	} );

	it( 'drops a cut left fully outside the window', () => {
		const withCut = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 8000,
			halfSpanMs: 1000,
			id: 'c1',
		} );
		const s = reduce( withCut, { type: 'SET_TRIM_END', ms: 7000 } );
		expect( s.trimEndMs ).toBe( 7000 );
		expect( s.cuts ).toEqual( [] );
		expect( s.selectedCutId ).toBeNull();
	} );
} );

describe( 'minimum output on sessions loaded below the minimum', () => {
	const loaded = reduce( createEditSession( 0 ), {
		type: 'LOAD',
		operations: [ { type: 'trim', start_ms: 0, end_ms: 900 } ],
		durationMs: 10000,
	} );

	it( 'loads server state as-is even under the minimum', () => {
		expect( loaded.trimEndMs ).toBe( 900 );
		expect( getOutputDurationMs( loaded ) ).toBe( 900 );
	} );

	it( 'refuses edits that would shrink the output further', () => {
		expect( reduce( loaded, { type: 'SET_TRIM_START', ms: 100 } ) ).toBe( loaded );
	} );

	it( 'allows edits that grow the output back', () => {
		const grown = reduce( loaded, { type: 'SET_TRIM_END', ms: 2000 } );
		expect( grown.trimEndMs ).toBe( 2000 );
	} );

	it( 'restores the 1000ms floor once the output recovers', () => {
		const grown = reduce( loaded, { type: 'SET_TRIM_END', ms: 2000 } );
		const shrunk = reduce( grown, { type: 'SET_TRIM_END', ms: 100 } );
		expect( shrunk.trimEndMs ).toBe( 1000 );
	} );
} );

describe( 'ADD_CUT', () => {
	it( 'adds a ±2s cut around the playhead by default and selects it', () => {
		const s = reduce( createEditSession( 20000 ), { type: 'ADD_CUT', atMs: 5000 } );
		expect( s.cuts ).toHaveLength( 1 );
		expect( s.cuts[ 0 ].startMs ).toBe( 5000 - DEFAULT_CUT_HALF_SPAN_MS );
		expect( s.cuts[ 0 ].endMs ).toBe( 5000 + DEFAULT_CUT_HALF_SPAN_MS );
		expect( typeof s.cuts[ 0 ].id ).toBe( 'string' );
		expect( s.selectedCutId ).toBe( s.cuts[ 0 ].id );
	} );

	it( 'honors an explicit id', () => {
		const s = reduce( createEditSession( 20000 ), { type: 'ADD_CUT', atMs: 5000, id: 'my-cut' } );
		expect( s.cuts[ 0 ].id ).toBe( 'my-cut' );
		expect( s.selectedCutId ).toBe( 'my-cut' );
	} );

	it( 'rounds a fractional playhead', () => {
		const s = reduce( createEditSession( 20000 ), { type: 'ADD_CUT', atMs: 5000.4 } );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 3000, endMs: 7000 } );
	} );

	it( 'clamps the span to the window start', () => {
		const s = reduce( createEditSession( 20000 ), { type: 'ADD_CUT', atMs: 500 } );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 0, endMs: 2500 } );
	} );

	it( 'clamps the span to the window end', () => {
		const s = reduce( createEditSession( 20000 ), { type: 'ADD_CUT', atMs: 20000 } );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 18000, endMs: 20000 } );
	} );

	it( 'is a no-op when the playhead is outside the trim window', () => {
		const trimmed = reduce( createEditSession( 20000 ), { type: 'SET_TRIM_END', ms: 10000 } );
		expect( reduce( trimmed, { type: 'ADD_CUT', atMs: 15000 } ) ).toBe( trimmed );
	} );

	it( 'merges into an overlapping cut and keeps the existing id', () => {
		const s = reduceAll( createEditSession( 20000 ), [
			{ type: 'ADD_CUT', atMs: 4000, halfSpanMs: 1000, id: 'c1' }, // [3000, 5000]
			{ type: 'ADD_CUT', atMs: 6000, halfSpanMs: 2000, id: 'c2' }, // [4000, 8000]
		] );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 3000, endMs: 8000 } ] );
		expect( s.selectedCutId ).toBe( 'c1' );
	} );

	it( 'bridges multiple cuts into one', () => {
		const s = reduceAll( createEditSession( 20000 ), [
			{ type: 'ADD_CUT', atMs: 2500, halfSpanMs: 500, id: 'c1' }, // [2000, 3000]
			{ type: 'ADD_CUT', atMs: 6500, halfSpanMs: 500, id: 'c2' }, // [6000, 7000]
			{ type: 'ADD_CUT', atMs: 4500, halfSpanMs: 2000, id: 'c3' }, // [2500, 6500]
		] );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 2000, endMs: 7000 } ] );
		expect( s.selectedCutId ).toBe( 'c1' );
	} );

	it( 'is a structural no-op when the new cut is inside an existing one', () => {
		const withCut = reduce( createEditSession( 20000 ), {
			type: 'ADD_CUT',
			atMs: 5000,
			halfSpanMs: 2000,
			id: 'c1',
		} );
		const s = reduce( withCut, { type: 'ADD_CUT', atMs: 5000, halfSpanMs: 1000, id: 'c2' } );
		expect( s ).toBe( withCut );
	} );

	it( 'shrinks the span to preserve the minimum output', () => {
		const s = reduce( createEditSession( 4000 ), { type: 'ADD_CUT', atMs: 2500 } );
		// Full ±2000 span would leave 500ms; ±1500 leaves exactly 1000.
		expect( s.cuts ).toEqual( [ { id: s.cuts[ 0 ].id, startMs: 1000, endMs: 4000 } ] );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'is rejected outright when even a 1ms cut would violate the minimum output', () => {
		const s = createEditSession( 1000 );
		expect( reduce( s, { type: 'ADD_CUT', atMs: 500 } ) ).toBe( s );
	} );

	it( 'accounts for existing cuts when enforcing the minimum output', () => {
		const s = reduceAll( createEditSession( 10000 ), [
			{ type: 'ADD_CUT', atMs: 2000, halfSpanMs: 2000, id: 'a' }, // [0, 4000]
			{ type: 'ADD_CUT', atMs: 7500, halfSpanMs: 2500, id: 'b' }, // [5000, 10000], output 1000
		] );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
		// Only 1000ms remain visible; any further cut must be rejected.
		expect( reduce( s, { type: 'ADD_CUT', atMs: 4500, halfSpanMs: 500, id: 'c' } ) ).toBe( s );
	} );
} );

describe( 'UPDATE_CUT', () => {
	const base = reduce( createEditSession( 20000 ), {
		type: 'ADD_CUT',
		atMs: 4000,
		halfSpanMs: 1000,
		id: 'c1',
	} ); // [3000, 5000]

	it( 'moves the end edge', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', endMs: 6000 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 3000, endMs: 6000 } ] );
	} );

	it( 'moves the start edge and rounds fractional input', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', startMs: 2500.4 } );
		expect( s.cuts[ 0 ].startMs ).toBe( 2500 );
	} );

	it( 'clamps edges to the trim window', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', startMs: -100 } );
		expect( s.cuts[ 0 ].startMs ).toBe( 0 );
	} );

	it( 'keeps 1ms of width when the start edge crosses the end edge', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', startMs: 6000 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 4999, endMs: 5000 } ] );
	} );

	it( 'keeps 1ms of width when the end edge crosses the start edge', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', endMs: 1000 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 3000, endMs: 3001 } ] );
	} );

	it( 'merges into a neighbor, keeps the dragged id, and moves the selection with it', () => {
		const two = reduceAll( createEditSession( 20000 ), [
			{ type: 'ADD_CUT', atMs: 2500, halfSpanMs: 500, id: 'c1' }, // [2000, 3000]
			{ type: 'ADD_CUT', atMs: 5500, halfSpanMs: 500, id: 'c2' }, // [5000, 6000]
		] );
		expect( two.selectedCutId ).toBe( 'c2' );

		const s = reduce( two, { type: 'UPDATE_CUT', id: 'c1', endMs: 5500 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 2000, endMs: 6000 } ] );
		expect( s.selectedCutId ).toBe( 'c1' );
	} );

	it( 'clamps a growing end edge to preserve the minimum output', () => {
		const wide = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 4600,
			halfSpanMs: 4100,
			id: 'c1',
		} ); // [500, 8700], output 1800
		const s = reduce( wide, { type: 'UPDATE_CUT', id: 'c1', endMs: 9900 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 500, endMs: 9500 } ] );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'clamps a growing start edge to preserve the minimum output', () => {
		const late = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 9450,
			halfSpanMs: 450,
			id: 'c1',
		} ); // [9000, 9900], output 9100
		const s = reduce( late, { type: 'UPDATE_CUT', id: 'c1', startMs: 300 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 900, endMs: 9900 } ] );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'rejects a two-edge move that violates the minimum output', () => {
		const small = reduce( createEditSession( 2000 ), {
			type: 'ADD_CUT',
			atMs: 950,
			halfSpanMs: 50,
			id: 'c1',
		} ); // [900, 1000], output 1900
		expect( reduce( small, { type: 'UPDATE_CUT', id: 'c1', startMs: 0, endMs: 2000 } ) ).toBe(
			small
		);
	} );

	it( 'applies a valid two-edge move', () => {
		const s = reduce( base, { type: 'UPDATE_CUT', id: 'c1', startMs: 2000, endMs: 7000 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 2000, endMs: 7000 } ] );
	} );

	it( 'is a no-op for an unknown id', () => {
		expect( reduce( base, { type: 'UPDATE_CUT', id: 'nope', endMs: 6000 } ) ).toBe( base );
	} );

	it( 'is a no-op when no edge is provided', () => {
		expect( reduce( base, { type: 'UPDATE_CUT', id: 'c1' } ) ).toBe( base );
	} );
} );

describe( 'MOVE_CUT', () => {
	const base = reduceAll( createEditSession( 20000 ), [
		{ type: 'SET_TRIM_START', ms: 1000 },
		{ type: 'SET_TRIM_END', ms: 19000 },
		{ type: 'ADD_CUT', atMs: 5000, halfSpanMs: 1000, id: 'c1' }, // [4000, 6000]
		{ type: 'ADD_CUT', atMs: 10000, halfSpanMs: 500, id: 'c2' }, // [9500, 10500]
	] );

	it( 'moves the cut to the requested start, preserving its width', () => {
		const s = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 7000 } );
		expect( s.cuts ).toEqual( [
			{ id: 'c1', startMs: 7000, endMs: 9000 },
			{ id: 'c2', startMs: 9500, endMs: 10500 },
		] );
	} );

	it( 'rounds fractional input', () => {
		const s = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 6999.6 } );
		expect( s.cuts[ 0 ] ).toEqual( { id: 'c1', startMs: 7000, endMs: 9000 } );
	} );

	it( 'clamps to the trim start', () => {
		const s = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 200 } );
		expect( s.cuts[ 0 ] ).toEqual( { id: 'c1', startMs: 1000, endMs: 3000 } );
	} );

	it( 'clamps so the far end stays inside the trim window', () => {
		const s = reduce( base, { type: 'MOVE_CUT', id: 'c2', startMs: 18800 } );
		expect( s.cuts[ 1 ] ).toEqual( { id: 'c2', startMs: 18000, endMs: 19000 } );
	} );

	it( 'merges into an overlapped cut, keeps the dragged id, and moves the selection with it', () => {
		expect( base.selectedCutId ).toBe( 'c2' );
		// c1 lands on [9000, 11000], swallowing the selected c2 [9500, 10500].
		const s = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 9000 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 9000, endMs: 11000 } ] );
		expect( s.selectedCutId ).toBe( 'c1' );
	} );

	it( 'only shrinks the removed union: output never drops on a move', () => {
		const before = getOutputDurationMs( base ); // 18000 - 3000 = 15000
		expect( before ).toBe( 15000 );

		// A clear-air move removes exactly as much as before.
		const moved = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 7000 } );
		expect( getOutputDurationMs( moved ) ).toBe( before );

		// A merging move loses the overlap from the union, GROWING the output.
		const merged = reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 9000 } );
		expect( getOutputDurationMs( merged ) ).toBe( 16000 );
	} );

	it( 'never violates the minimum output, even from a session already at it', () => {
		const atMinimum = reduce( createEditSession( 10000 ), {
			type: 'ADD_CUT',
			atMs: 5000,
			halfSpanMs: 4500,
			id: 'c1',
		} ); // [500, 9500], output exactly 1000
		expect( getOutputDurationMs( atMinimum ) ).toBe( MIN_OUTPUT_MS );

		const s = reduce( atMinimum, { type: 'MOVE_CUT', id: 'c1', startMs: 0 } );
		expect( s.cuts ).toEqual( [ { id: 'c1', startMs: 0, endMs: 9000 } ] );
		expect( getOutputDurationMs( s ) ).toBe( MIN_OUTPUT_MS );
	} );

	it( 'is a no-op for an unknown id', () => {
		expect( reduce( base, { type: 'MOVE_CUT', id: 'nope', startMs: 7000 } ) ).toBe( base );
	} );

	it( 'returns the same reference for a same-position move', () => {
		expect( reduce( base, { type: 'MOVE_CUT', id: 'c1', startMs: 4000 } ) ).toBe( base );
	} );
} );

describe( 'REMOVE_CUT', () => {
	const withCuts = reduceAll( createEditSession( 20000 ), [
		{ type: 'ADD_CUT', atMs: 2500, halfSpanMs: 500, id: 'c1' },
		{ type: 'ADD_CUT', atMs: 5500, halfSpanMs: 500, id: 'c2' },
	] );

	it( 'removes the cut', () => {
		const s = reduce( withCuts, { type: 'REMOVE_CUT', id: 'c1' } );
		expect( s.cuts.map( cut => cut.id ) ).toEqual( [ 'c2' ] );
	} );

	it( 'clears the selection when the selected cut is removed', () => {
		expect( withCuts.selectedCutId ).toBe( 'c2' );
		const s = reduce( withCuts, { type: 'REMOVE_CUT', id: 'c2' } );
		expect( s.selectedCutId ).toBeNull();
	} );

	it( 'preserves an unrelated selection', () => {
		const s = reduce( withCuts, { type: 'REMOVE_CUT', id: 'c1' } );
		expect( s.selectedCutId ).toBe( 'c2' );
	} );

	it( 'is a no-op for an unknown id', () => {
		expect( reduce( withCuts, { type: 'REMOVE_CUT', id: 'nope' } ) ).toBe( withCuts );
	} );
} );

describe( 'SELECT_CUT', () => {
	const withCut = reduce( createEditSession( 20000 ), {
		type: 'ADD_CUT',
		atMs: 5000,
		id: 'c1',
	} );

	it( 'selects an existing cut', () => {
		const cleared = reduce( withCut, { type: 'SELECT_CUT', id: null } );
		const s = reduce( cleared, { type: 'SELECT_CUT', id: 'c1' } );
		expect( s.selectedCutId ).toBe( 'c1' );
	} );

	it( 'clears the selection with null', () => {
		const s = reduce( withCut, { type: 'SELECT_CUT', id: null } );
		expect( s.selectedCutId ).toBeNull();
	} );

	it( 'ignores an unknown id', () => {
		expect( reduce( withCut, { type: 'SELECT_CUT', id: 'nope' } ) ).toBe( withCut );
	} );

	it( 'returns the same reference when re-selecting the current cut', () => {
		expect( reduce( withCut, { type: 'SELECT_CUT', id: 'c1' } ) ).toBe( withCut );
	} );
} );

describe( 'LOAD', () => {
	const start = createEditSession( 0 );

	it( 'builds a session from trim and cut operations', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [
				{ type: 'trim', start_ms: 1000, end_ms: 9000 },
				{ type: 'cut', start_ms: 2000, end_ms: 3000 },
				{ type: 'cut', start_ms: 5000, end_ms: 6000 },
			],
			durationMs: 10000,
		} );
		expect( s.durationMs ).toBe( 10000 );
		expect( s.trimStartMs ).toBe( 1000 );
		expect( s.trimEndMs ).toBe( 9000 );
		expect( s.cuts.map( cut => [ cut.startMs, cut.endMs ] ) ).toEqual( [
			[ 2000, 3000 ],
			[ 5000, 6000 ],
		] );
		expect( s.cuts.every( cut => typeof cut.id === 'string' && cut.id.length > 0 ) ).toBe( true );
		expect( s.selectedCutId ).toBeNull();
	} );

	it( 'defaults to the full range without a trim operation', () => {
		const s = reduce( start, { type: 'LOAD', operations: [], durationMs: 10000 } );
		expect( s.trimStartMs ).toBe( 0 );
		expect( s.trimEndMs ).toBe( 10000 );
	} );

	it( 'sorts unsorted cuts', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [
				{ type: 'cut', start_ms: 5000, end_ms: 6000 },
				{ type: 'cut', start_ms: 2000, end_ms: 3000 },
			],
			durationMs: 10000,
		} );
		expect( s.cuts.map( cut => cut.startMs ) ).toEqual( [ 2000, 5000 ] );
	} );

	it( 'merges overlapping cuts', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [
				{ type: 'cut', start_ms: 2000, end_ms: 4000 },
				{ type: 'cut', start_ms: 3000, end_ms: 5000 },
			],
			durationMs: 10000,
		} );
		expect( s.cuts ).toHaveLength( 1 );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 2000, endMs: 5000 } );
	} );

	it( 'clips cuts to the trim window and drops cuts outside it', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [
				{ type: 'trim', start_ms: 2000, end_ms: 8000 },
				{ type: 'cut', start_ms: 1000, end_ms: 3000 },
				{ type: 'cut', start_ms: 8500, end_ms: 9000 },
			],
			durationMs: 10000,
		} );
		expect( s.cuts ).toHaveLength( 1 );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 2000, endMs: 3000 } );
	} );

	it( 'drops an inverted cut operation', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [ { type: 'cut', start_ms: 5000, end_ms: 4000 } ],
			durationMs: 10000,
		} );
		expect( s.cuts ).toEqual( [] );
	} );

	it( 'falls back to the full range for a degenerate trim', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [ { type: 'trim', start_ms: 5000, end_ms: 5000 } ],
			durationMs: 10000,
		} );
		expect( s.trimStartMs ).toBe( 0 );
		expect( s.trimEndMs ).toBe( 10000 );
	} );

	it( 'rounds fractional operation values', () => {
		const s = reduce( start, {
			type: 'LOAD',
			operations: [
				{ type: 'trim', start_ms: 999.6, end_ms: 9000.4 },
				{ type: 'cut', start_ms: 1999.5, end_ms: 3000.4 },
			],
			durationMs: 10000,
		} );
		expect( s.trimStartMs ).toBe( 1000 );
		expect( s.trimEndMs ).toBe( 9000 );
		expect( s.cuts[ 0 ] ).toMatchObject( { startMs: 2000, endMs: 3000 } );
	} );

	it( 'replaces an edited session entirely', () => {
		const edited = reduceAll( createEditSession( 20000 ), [
			{ type: 'SET_TRIM_START', ms: 5000 },
			{ type: 'ADD_CUT', atMs: 10000, id: 'c1' },
		] );
		const s = reduce( edited, { type: 'LOAD', operations: [], durationMs: 30000 } );
		expect( s ).toEqual( createEditSession( 30000 ) );
	} );
} );

describe( 'RESET', () => {
	it( 'restores the pristine full-range session and keeps the duration', () => {
		const edited = reduceAll( createEditSession( 20000 ), [
			{ type: 'SET_TRIM_START', ms: 5000 },
			{ type: 'SET_TRIM_END', ms: 15000 },
			{ type: 'ADD_CUT', atMs: 10000, id: 'c1' },
		] );
		const s = reduce( edited, { type: 'RESET' } );
		expect( s ).toEqual( createEditSession( 20000 ) );
	} );

	it( 'returns the same reference on a pristine session', () => {
		const pristine = createEditSession( 20000 );
		expect( reduce( pristine, { type: 'RESET' } ) ).toBe( pristine );
	} );
} );

describe( 'getOutputDurationMs', () => {
	it( 'measures the trim window minus cut time', () => {
		const s = reduceAll( createEditSession( 20000 ), [
			{ type: 'SET_TRIM_START', ms: 2000 },
			{ type: 'SET_TRIM_END', ms: 18000 },
			{ type: 'ADD_CUT', atMs: 10000, id: 'c1' }, // [8000, 12000]
		] );
		expect( getOutputDurationMs( s ) ).toBe( 16000 - 4000 );
	} );
} );

describe( 'invariants under random action sequences', () => {
	it( 'holds every invariant across 300 random actions', () => {
		// Deterministic LCG so failures are reproducible.
		let seed = 42;
		const rand = () => {
			seed = ( seed * 1664525 + 1013904223 ) % 4294967296;
			return seed / 4294967296;
		};
		const duration = 60000;
		let s = createEditSession( duration );
		let idCounter = 0;

		for ( let i = 0; i < 300; i++ ) {
			const roll = rand();
			let action: EditSessionAction;
			if ( roll < 0.2 ) {
				action = { type: 'SET_TRIM_START', ms: rand() * duration * 1.2 - 3000 };
			} else if ( roll < 0.4 ) {
				action = { type: 'SET_TRIM_END', ms: rand() * duration * 1.2 - 3000 };
			} else if ( roll < 0.6 ) {
				idCounter++;
				action = {
					type: 'ADD_CUT',
					atMs: rand() * duration,
					halfSpanMs: rand() * 3000,
					id: `r${ idCounter }`,
				};
			} else if ( roll < 0.75 && s.cuts.length > 0 ) {
				const cut = s.cuts[ Math.floor( rand() * s.cuts.length ) ];
				action = {
					type: 'UPDATE_CUT',
					id: cut.id,
					...( rand() < 0.7 ? { startMs: rand() * duration * 1.1 - 3000 } : {} ),
					...( rand() < 0.7 ? { endMs: rand() * duration * 1.1 - 3000 } : {} ),
				};
			} else if ( roll < 0.85 && s.cuts.length > 0 ) {
				const cut = s.cuts[ Math.floor( rand() * s.cuts.length ) ];
				action = {
					type: 'MOVE_CUT',
					id: cut.id,
					startMs: rand() * duration * 1.2 - 3000,
				};
			} else if ( roll < 0.9 && s.cuts.length > 0 ) {
				action = {
					type: 'REMOVE_CUT',
					id: s.cuts[ Math.floor( rand() * s.cuts.length ) ].id,
				};
			} else if ( roll < 0.97 ) {
				action = {
					type: 'SELECT_CUT',
					id: s.cuts.length > 0 ? s.cuts[ 0 ].id : null,
				};
			} else {
				action = { type: 'RESET' };
			}

			s = reduce( s, action );
			assertInvariants( s );
			expect( getOutputDurationMs( s ) ).toBeGreaterThanOrEqual( MIN_OUTPUT_MS );
		}
	} );
} );

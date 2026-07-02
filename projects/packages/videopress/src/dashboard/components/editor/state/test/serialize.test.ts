import { createEditSession, editSessionReducer } from '../edit-session';
import {
	areOperationsEqual,
	isDirty,
	operationsToSession,
	sessionToOperations,
} from '../serialize';
import type { EditOperation, EditSession } from '../edit-session';

/**
 * Hand-build a session, bypassing the reducer, for serialization edge cases.
 *
 * @param overrides - Fields to override on a 10s full-range session.
 * @return The session.
 */
function makeSession( overrides: Partial< EditSession > = {} ): EditSession {
	return { ...createEditSession( 10000 ), ...overrides };
}

describe( 'sessionToOperations', () => {
	it( 'serializes a pristine session to an empty list', () => {
		expect( sessionToOperations( createEditSession( 10000 ), 10000 ) ).toEqual( [] );
	} );

	it( 'omits a full-range trim but keeps cuts', () => {
		const session = makeSession( {
			cuts: [ { id: 'a', startMs: 4000, endMs: 6000 } ],
		} );
		expect( sessionToOperations( session, 10000 ) ).toEqual( [
			{ type: 'cut', start_ms: 4000, end_ms: 6000 },
		] );
	} );

	it( 'includes a trim when the start moved', () => {
		const session = makeSession( { trimStartMs: 1000 } );
		expect( sessionToOperations( session, 10000 ) ).toEqual( [
			{ type: 'trim', start_ms: 1000, end_ms: 10000 },
		] );
	} );

	it( 'includes a trim when the end moved', () => {
		const session = makeSession( { trimEndMs: 9000 } );
		expect( sessionToOperations( session, 10000 ) ).toEqual( [
			{ type: 'trim', start_ms: 0, end_ms: 9000 },
		] );
	} );

	it( 'emits the trim first and the cuts sorted by start', () => {
		const session = makeSession( {
			trimStartMs: 500,
			trimEndMs: 9500,
			cuts: [
				{ id: 'b', startMs: 6000, endMs: 7000 },
				{ id: 'a', startMs: 1000, endMs: 2000 },
			],
		} );
		expect( sessionToOperations( session, 10000 ) ).toEqual( [
			{ type: 'trim', start_ms: 500, end_ms: 9500 },
			{ type: 'cut', start_ms: 1000, end_ms: 2000 },
			{ type: 'cut', start_ms: 6000, end_ms: 7000 },
		] );
	} );

	it( 'does not mutate the session cut order', () => {
		const session = makeSession( {
			cuts: [
				{ id: 'b', startMs: 6000, endMs: 7000 },
				{ id: 'a', startMs: 1000, endMs: 2000 },
			],
		} );
		sessionToOperations( session, 10000 );
		expect( session.cuts[ 0 ].id ).toBe( 'b' );
	} );

	it( 'ignores the selection', () => {
		const session = makeSession( {
			cuts: [ { id: 'a', startMs: 4000, endMs: 6000 } ],
			selectedCutId: 'a',
		} );
		expect( sessionToOperations( session, 10000 ) ).toEqual( [
			{ type: 'cut', start_ms: 4000, end_ms: 6000 },
		] );
	} );
} );

describe( 'operationsToSession', () => {
	it( 'builds a session from operations', () => {
		const session = operationsToSession(
			[
				{ type: 'trim', start_ms: 1000, end_ms: 9000 },
				{ type: 'cut', start_ms: 2000, end_ms: 3000 },
			],
			10000
		);
		expect( session.durationMs ).toBe( 10000 );
		expect( session.trimStartMs ).toBe( 1000 );
		expect( session.trimEndMs ).toBe( 9000 );
		expect( session.cuts ).toHaveLength( 1 );
		expect( session.cuts[ 0 ] ).toMatchObject( { startMs: 2000, endMs: 3000 } );
		expect( session.selectedCutId ).toBeNull();
	} );

	it( 'defaults to the full range without a trim operation', () => {
		const session = operationsToSession( [], 10000 );
		expect( session ).toEqual( createEditSession( 10000 ) );
	} );

	it( 'normalizes unsorted and overlapping cuts', () => {
		const session = operationsToSession(
			[
				{ type: 'cut', start_ms: 5000, end_ms: 7000 },
				{ type: 'cut', start_ms: 2000, end_ms: 3000 },
				{ type: 'cut', start_ms: 6000, end_ms: 8000 },
			],
			10000
		);
		expect( session.cuts.map( cut => [ cut.startMs, cut.endMs ] ) ).toEqual( [
			[ 2000, 3000 ],
			[ 5000, 8000 ],
		] );
	} );

	it( 'clips cuts to the trim window', () => {
		const session = operationsToSession(
			[
				{ type: 'trim', start_ms: 2000, end_ms: 8000 },
				{ type: 'cut', start_ms: 1000, end_ms: 3000 },
			],
			10000
		);
		expect( session.cuts[ 0 ] ).toMatchObject( { startMs: 2000, endMs: 3000 } );
	} );
} );

describe( 'round-trip serialization', () => {
	it( 'operations survive a round trip unchanged when canonical', () => {
		const ops: EditOperation[] = [
			{ type: 'trim', start_ms: 500, end_ms: 9500 },
			{ type: 'cut', start_ms: 1000, end_ms: 2000 },
			{ type: 'cut', start_ms: 6000, end_ms: 7000 },
		];
		const roundTripped = sessionToOperations( operationsToSession( ops, 10000 ), 10000 );
		expect( roundTripped ).toEqual( ops );
	} );

	it( 'non-canonical operations are canonicalized by the round trip', () => {
		const ops: EditOperation[] = [
			{ type: 'trim', start_ms: 0, end_ms: 10000 }, // full range: dropped
			{ type: 'cut', start_ms: 6000, end_ms: 7000 }, // unsorted
			{ type: 'cut', start_ms: 1000, end_ms: 2500 },
			{ type: 'cut', start_ms: 2000, end_ms: 3000 }, // overlapping: merged
		];
		expect( sessionToOperations( operationsToSession( ops, 10000 ), 10000 ) ).toEqual( [
			{ type: 'cut', start_ms: 1000, end_ms: 3000 },
			{ type: 'cut', start_ms: 6000, end_ms: 7000 },
		] );
	} );

	it( 'an edited session survives a round trip', () => {
		let session = createEditSession( 20000 );
		session = editSessionReducer( session, { type: 'SET_TRIM_START', ms: 1000 } );
		session = editSessionReducer( session, { type: 'SET_TRIM_END', ms: 19000 } );
		session = editSessionReducer( session, { type: 'ADD_CUT', atMs: 5000, id: 'c1' } );
		session = editSessionReducer( session, { type: 'ADD_CUT', atMs: 12000, id: 'c2' } );

		const ops = sessionToOperations( session, 20000 );
		const restored = operationsToSession( ops, 20000 );
		expect( restored.trimStartMs ).toBe( session.trimStartMs );
		expect( restored.trimEndMs ).toBe( session.trimEndMs );
		expect( restored.cuts.map( cut => [ cut.startMs, cut.endMs ] ) ).toEqual(
			session.cuts.map( cut => [ cut.startMs, cut.endMs ] )
		);
	} );
} );

describe( 'areOperationsEqual', () => {
	const trim: EditOperation = { type: 'trim', start_ms: 100, end_ms: 900 };
	const cut: EditOperation = { type: 'cut', start_ms: 300, end_ms: 400 };

	it( 'accepts identical lists', () => {
		expect( areOperationsEqual( [ trim, cut ], [ { ...trim }, { ...cut } ] ) ).toBe( true );
	} );

	it( 'accepts two empty lists', () => {
		expect( areOperationsEqual( [], [] ) ).toBe( true );
	} );

	it( 'rejects different lengths', () => {
		expect( areOperationsEqual( [ trim ], [ trim, cut ] ) ).toBe( false );
	} );

	it( 'rejects different types', () => {
		expect( areOperationsEqual( [ trim ], [ { type: 'cut', start_ms: 100, end_ms: 900 } ] ) ).toBe(
			false
		);
	} );

	it( 'rejects different timestamps', () => {
		expect( areOperationsEqual( [ cut ], [ { type: 'cut', start_ms: 300, end_ms: 401 } ] ) ).toBe(
			false
		);
	} );

	it( 'rejects different order', () => {
		expect( areOperationsEqual( [ trim, cut ], [ cut, trim ] ) ).toBe( false );
	} );
} );

describe( 'isDirty', () => {
	it( 'a pristine session is clean against an empty baseline', () => {
		expect( isDirty( createEditSession( 10000 ), [] ) ).toBe( false );
	} );

	it( 'a pristine session is clean against an explicit full-range trim', () => {
		expect(
			isDirty( createEditSession( 10000 ), [ { type: 'trim', start_ms: 0, end_ms: 10000 } ] )
		).toBe( false );
	} );

	it( 'an edited session is dirty against an empty baseline', () => {
		const session = editSessionReducer( createEditSession( 10000 ), {
			type: 'SET_TRIM_START',
			ms: 1000,
		} );
		expect( isDirty( session, [] ) ).toBe( true );
	} );

	it( 'a session matching an unsorted baseline is clean', () => {
		const session = makeSession( {
			trimStartMs: 500,
			cuts: [
				{ id: 'a', startMs: 1000, endMs: 2000 },
				{ id: 'b', startMs: 6000, endMs: 7000 },
			],
		} );
		expect(
			isDirty( session, [
				{ type: 'cut', start_ms: 6000, end_ms: 7000 },
				{ type: 'trim', start_ms: 500, end_ms: 10000 },
				{ type: 'cut', start_ms: 1000, end_ms: 2000 },
			] )
		).toBe( false );
	} );

	it( 'a merged cut matches a baseline of touching cuts', () => {
		const session = makeSession( { cuts: [ { id: 'x', startMs: 2000, endMs: 4000 } ] } );
		expect(
			isDirty( session, [
				{ type: 'cut', start_ms: 2000, end_ms: 3000 },
				{ type: 'cut', start_ms: 3000, end_ms: 4000 },
			] )
		).toBe( false );
	} );

	it( 'selection changes never dirty the session', () => {
		const session = makeSession( {
			cuts: [ { id: 'a', startMs: 4000, endMs: 6000 } ],
			selectedCutId: 'a',
		} );
		expect( isDirty( session, [ { type: 'cut', start_ms: 4000, end_ms: 6000 } ] ) ).toBe( false );
	} );

	it( 'a genuinely different cut is dirty', () => {
		const session = makeSession( { cuts: [ { id: 'a', startMs: 4000, endMs: 6000 } ] } );
		expect( isDirty( session, [ { type: 'cut', start_ms: 4000, end_ms: 6001 } ] ) ).toBe( true );
	} );

	it( 'undoing back to the baseline reports clean again', () => {
		const baseline: EditOperation[] = [ { type: 'cut', start_ms: 4000, end_ms: 6000 } ];
		const loaded = operationsToSession( baseline, 10000 );
		const edited = editSessionReducer( loaded, { type: 'SET_TRIM_END', ms: 9000 } );
		expect( isDirty( edited, baseline ) ).toBe( true );

		const reverted = editSessionReducer( edited, { type: 'SET_TRIM_END', ms: 10000 } );
		expect( isDirty( reverted, baseline ) ).toBe( false );
	} );
} );

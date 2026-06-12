import { getContributorIds, getLocalUserId } from '../awareness';

type StateSpec = Record< number, number | null >;

/**
 * Build a fake awareness keyed by client id (value = user id, or null for a
 * state with no collaboratorInfo.id). `clientID` marks the local client.
 *
 * @param spec     - States keyed by client id.
 * @param clientID - The local client id.
 * @return A minimal fake awareness with a getStates() method and clientID.
 */
function fakeAwareness( spec: StateSpec, clientID: number ) {
	const states = new Map< number, { collaboratorInfo?: { id?: number } } >();
	for ( const key of Object.keys( spec ) ) {
		const id = spec[ Number( key ) ];
		states.set( Number( key ), { collaboratorInfo: id === null ? {} : { id } } );
	}
	return { clientID, getStates: () => states };
}

describe( 'getContributorIds', () => {
	it( 'returns all numeric collaborator ids, including duplicates', () => {
		const awareness = fakeAwareness( { 1: 7, 2: 7, 3: 9 }, 1 );
		expect( getContributorIds( awareness as never ) ).toEqual( [ 7, 7, 9 ] );
	} );

	it( 'skips states with no collaborator id', () => {
		const awareness = fakeAwareness( { 1: 7, 2: null, 3: 9 }, 1 );
		expect( getContributorIds( awareness as never ) ).toEqual( [ 7, 9 ] );
	} );
} );

describe( 'getLocalUserId', () => {
	it( 'returns the local client id-keyed collaborator id', () => {
		const awareness = fakeAwareness( { 1: 7, 2: 9 }, 2 );
		expect( getLocalUserId( awareness as never ) ).toBe( 9 );
	} );

	it( 'returns undefined when the local client is not present', () => {
		const awareness = fakeAwareness( { 2: 9 }, 1 );
		expect( getLocalUserId( awareness as never ) ).toBeUndefined();
	} );
} );

import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import actions from '../actions';
import reducers from '../reducers';
import selectors from '../selectors';

/**
 * Register a store seeded as the package seeds it at load.
 *
 * @param {object} initialState - What PHP put on the page.
 * @param {string} storeId      - A unique id, since a store cannot be registered twice.
 * @return {object} The store id.
 */
const storeWith = ( initialState, storeId ) => {
	register( createReduxStore( storeId, { reducer: reducers, actions, selectors, initialState } ) );

	return storeId;
};

describe( 'setConnectionOwner', () => {
	const initialState = {
		connectionOwner: { id: 1, displayName: 'Original Owner' },
		userConnectionData: {
			currentUser: { id: 1, isMaster: true, isConnected: true },
			connectionOwner: 'Original Owner',
		},
	};

	it( 'records the new owner for surfaces reading the connection owner', () => {
		const id = storeWith( initialState, 'test/owner-record' );

		dispatch( id ).setConnectionOwner( { id: 7, displayName: 'Kazz' } );

		expect( select( id ).getConnectionOwner() ).toEqual( { id: 7, displayName: 'Kazz' } );
	} );

	// isMaster is what the UI gates owner-only actions on, so it has to move too.
	it( 'stops reporting the current user as the owner', () => {
		const id = storeWith( initialState, 'test/owner-is-master' );

		dispatch( id ).setConnectionOwner( { id: 7, displayName: 'Kazz' } );

		const data = select( id ).getUserConnectionData();
		expect( data.currentUser.isMaster ).toBe( false );
		expect( data.connectionOwner ).toBe( 'Kazz' );
	} );

	it( 'stops answering whether the owner is the protected owner', () => {
		const id = storeWith( { ...initialState, hasProtectedOwner: true }, 'test/owner-protected' );

		dispatch( id ).setConnectionOwner( { id: 7, displayName: 'Kazz' } );

		expect( select( id ).getHasProtectedOwner() ).toBeNull();
	} );

	it( 'leaves the rest of the user connection data alone', () => {
		const id = storeWith( initialState, 'test/owner-untouched' );

		dispatch( id ).setConnectionOwner( { id: 7, displayName: 'Kazz' } );

		const { currentUser } = select( id ).getUserConnectionData();
		expect( currentUser.id ).toBe( 1 );
		expect( currentUser.isConnected ).toBe( true );
	} );
} );

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

describe( 'disconnectUserSuccess', () => {
	const initialState = {
		connectionStatus: { isRegistered: true, isUserConnected: true, hasConnectedOwner: true },
		userConnectionData: {
			currentUser: { id: 2, isMaster: false, isConnected: true },
			connectionOwner: 'Original Owner',
		},
	};

	it( 'records the unlink in both slices that describe the viewer', () => {
		const id = storeWith( initialState, 'test/unlink-non-owner' );

		dispatch( id ).disconnectUserSuccess();

		expect( select( id ).getConnectionStatus().isUserConnected ).toBe( false );
		expect( select( id ).getUserConnectionData().currentUser.isConnected ).toBe( false );
	} );

	it( 'leaves the owner connected when a non-owner unlinks', () => {
		const id = storeWith( initialState, 'test/unlink-keeps-owner' );

		dispatch( id ).disconnectUserSuccess();

		expect( select( id ).getConnectionStatus().hasConnectedOwner ).toBe( true );
	} );

	it( 'leaves no connected owner when the unlink took every user with it', () => {
		const id = storeWith(
			{
				...initialState,
				userConnectionData: {
					...initialState.userConnectionData,
					currentUser: { id: 1, isMaster: true, isConnected: true },
				},
			},
			'test/unlink-owner'
		);

		dispatch( id ).disconnectUserSuccess( { disconnectedAllUsers: true } );

		expect( select( id ).getConnectionStatus().hasConnectedOwner ).toBe( false );
		expect( select( id ).getConnectionStatus().isUserConnected ).toBe( false );
	} );

	// Registration is the site's blog token, which no user disconnect touches.
	it( 'leaves the site registered', () => {
		const id = storeWith( initialState, 'test/unlink-keeps-registration' );

		dispatch( id ).disconnectUserSuccess( { disconnectedAllUsers: true } );

		expect( select( id ).getConnectionStatus().isRegistered ).toBe( true );
	} );
} );

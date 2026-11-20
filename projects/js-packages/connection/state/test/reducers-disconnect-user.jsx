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

/**
 * The state of a site whose owner is viewing it, as `Initial_State` fills it.
 *
 * @param {boolean} viewerIsOwner - Whether the viewer owns the connection.
 * @return {object} Initial state.
 */
const connectedState = viewerIsOwner => ( {
	connectionStatus: {
		isActive: true,
		isRegistered: true,
		isUserConnected: true,
		hasConnectedOwner: true,
	},
	connectionOwner: { id: 1, displayName: 'Original Owner' },
	userConnectionData: {
		currentUser: {
			id: viewerIsOwner ? 1 : 2,
			isMaster: viewerIsOwner,
			isConnected: true,
			wpcomUser: { ID: 99, login: 'wpcomuser', avatar: 'https://example.com/a.png' },
			possibleAccountErrors: { email_mismatch: true },
		},
		connectionOwner: 'Original Owner',
	},
} );

describe( 'disconnectUserSuccess', () => {
	// The endpoint reports no WordPress.com identity once the token is gone, and skips the
	// account-mismatch check for a user who is no longer connected.
	it( 'drops what the viewer had through their own token', () => {
		const id = storeWith( connectedState( false ), 'test/unlink-viewer' );

		dispatch( id ).disconnectUserSuccess();

		const { currentUser } = select( id ).getUserConnectionData();
		expect( select( id ).getConnectionStatus().isUserConnected ).toBe( false );
		expect( currentUser.isConnected ).toBe( false );
		expect( currentUser.wpcomUser ).toEqual( { avatar: false } );
		expect( currentUser.possibleAccountErrors ).toEqual( {} );
	} );

	it( 'leaves the owner alone when a non-owner unlinks', () => {
		const id = storeWith( connectedState( false ), 'test/unlink-keeps-owner' );

		dispatch( id ).disconnectUserSuccess();

		expect( select( id ).getConnectionStatus().hasConnectedOwner ).toBe( true );
		expect( select( id ).getConnectionStatus().isActive ).toBe( true );
		expect( select( id ).getConnectionOwner() ).toEqual( { id: 1, displayName: 'Original Owner' } );
		expect( select( id ).getUserConnectionData().connectionOwner ).toBe( 'Original Owner' );
	} );

	// The owner's unlink deletes the master_user option, so no owner survives it.
	it( 'leaves no owner, of record or connected, when the owner unlinks', () => {
		const id = storeWith( connectedState( true ), 'test/unlink-owner' );

		dispatch( id ).disconnectUserSuccess( { wasConnectionOwner: true } );

		expect( select( id ).getConnectionStatus().hasConnectedOwner ).toBe( false );
		// The endpoint reports the deprecated isActive as the same value.
		expect( select( id ).getConnectionStatus().isActive ).toBe( false );
		expect( select( id ).getConnectionOwner() ).toBeNull();
		expect( select( id ).getUserConnectionData().currentUser.isMaster ).toBe( false );
		expect( select( id ).getUserConnectionData().connectionOwner ).toBeNull();
	} );

	// Registration is the site's blog token, which no user disconnect touches.
	it( 'leaves the site registered', () => {
		const id = storeWith( connectedState( true ), 'test/unlink-keeps-registration' );

		dispatch( id ).disconnectUserSuccess( { wasConnectionOwner: true } );

		expect( select( id ).getConnectionStatus().isRegistered ).toBe( true );
	} );
} );

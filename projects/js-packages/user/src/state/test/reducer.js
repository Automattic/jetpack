/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	connectUrl as connectUrlReducer,
	status as statusReducer,
	user as userReducer,
	requests as requestsReducer,
	connectionRequests,
} from '../reducer';

describe( 'status reducer', () => {
	describe( '#disconnectSite', () => {
		it( 'should set siteConnected to false when disconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS',
				siteConnected: false,
			};
			const stateOut = statusReducer( stateIn, action );
			expect( stateOut.siteConnected ).to.be.false;
		} );

		it( "should set siteConnected to action.siteConnected's value when fetching connection status", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_CONNECTION_STATUS_FETCH',
				siteConnected: true,
			};
			const stateOut = statusReducer( stateIn, action );
			expect( stateOut.siteConnected ).to.equal( action.siteConnected );
		} );
	} );
} );

describe( 'connect url reducer', () => {
	it( 'state should default to empty string', () => {
		const state = connectUrlReducer( undefined, {} );
		expect( state ).to.eql( '' );
	} );
	describe( '#fetchConnectUrl', () => {
		it( "should set connectUrl to action.connectUrl's value when fetching connect url", () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS',
				connectUrl: '/asdf',
			};
			const stateOut = connectUrlReducer( stateIn, action );
			expect( stateOut ).to.equal( action.connectUrl );
		} );
	} );
} );

describe( 'user reducer', () => {
	describe( '#fetchConnectUrl', () => {
		it( 'should set state.user to action.userConnectionData when fetching connect url', () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_SUCCESS',
				userConnectionData: { a: 'b' },
			};
			const stateOut = userReducer( stateIn, action );
			expect( stateOut ).to.eql( action.userConnectionData );
		} );
	} );
} );

describe( 'requests reducer', () => {
	it( 'state should default to connectionRequests', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).to.equal( connectionRequests );
	} );

	describe( '#disconnectSite', () => {
		it( 'should set disconnectingSite to true when disconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.true;
		} );

		it( 'should set disconnectingSite to false when site was disconnected', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.false;
		} );

		it( 'should set disconnectingSite to false when disconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.false;
		} );
	} );

	describe( '#unlinkUser', () => {
		it( 'should set unlinkingUser to true when unliking user', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.true;
		} );

		it( 'should set unlinkingUser to false when user was unlinked', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.false;
		} );

		it( 'should set unlinkingUser to false when unlinking a user failed', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.false;
		} );
	} );

	describe( '#fetchConnectUrl', () => {
		it( 'should set fetchingConnectUrl to true when fetching connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.true;
		} );

		it( 'should set fetchingConnectUrl to false when connect URL was fetched', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.false;
		} );

		it( 'should set fetchingConnectUrl to false when fecthing the connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.false;
		} );
	} );

	describe( '#fetchUSerConnectionData', () => {
		it( "should set fetchingUserData to true when fetching User's connection data", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.true;
		} );

		it( "should set fetchingUserData to false when User's connection data was fetched", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.false;
		} );

		it( "should set fetchingUserData to false when fecthing the User's connection data", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.false;
		} );
	} );

	describe( '#authorizeUserInPlace', () => {
		it( 'should set isAuthorizingUserInPlace to true when authorization iframe is loaded', () => {
			const stateIn = {};
			const action = {
				type: 'AUTH_USER_IN_PLACE',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.authorizingUserInPlace ).to.be.true;
		} );

		it( 'should set isAuthorizingUserInPlace to false when when in-place authorization has completed', () => {
			const stateIn = {};
			const action = {
				type: 'AUTH_USER_IN_PLACE_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.authorizingUserInPlace ).to.be.false;
		} );
	} );

	describe( '#reconnectSite', () => {
		it( 'should set reconnectingSite to true when reconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.true;
		} );

		it( 'should set reconnectingSite to false when site was reconnected', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.false;
		} );

		it( 'should set reconnectingSite to false when reconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.false;
		} );
	} );
} );

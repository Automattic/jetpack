import {
	connectUrl as connectUrlReducer,
	status as statusReducer,
	user as userReducer,
	requests as requestsReducer,
	connectionRequests,
	hasSeenWCConnectionModal,
} from '../reducer';

describe( 'status reducer', () => {
	describe( '#disconnectSite', () => {
		test( 'should set siteConnected to false when disconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS',
				siteConnected: false,
			};
			const stateOut = statusReducer( stateIn, action );
			expect( stateOut.siteConnected ).toBe( false );
		} );

		test( "should set siteConnected to action.siteConnected's value when fetching connection status", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_CONNECTION_STATUS_FETCH',
				siteConnected: true,
			};
			const stateOut = statusReducer( stateIn, action );
			expect( stateOut.siteConnected ).toEqual( action.siteConnected );
		} );
	} );
} );

describe( 'connect url reducer', () => {
	test( 'state should default to empty string', () => {
		const state = connectUrlReducer( undefined, {} );
		expect( state ).toBe( '' );
	} );
	describe( '#fetchConnectUrl', () => {
		test( "should set connectUrl to action.connectUrl's value when fetching connect url", () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS',
				connectUrl: '/asdf',
			};
			const stateOut = connectUrlReducer( stateIn, action );
			expect( stateOut ).toEqual( action.connectUrl );
		} );
	} );
} );

describe( 'user reducer', () => {
	describe( '#fetchConnectUrl', () => {
		test( 'should set state.user to action.userConnectionData when fetching connect url', () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_SUCCESS',
				userConnectionData: { a: 'b' },
			};
			const stateOut = userReducer( stateIn, action );
			expect( stateOut ).toEqual( action.userConnectionData );
		} );
	} );
} );

describe( 'requests reducer', () => {
	test( 'state should default to connectionRequests', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).toEqual( connectionRequests );
	} );

	describe( '#disconnectSite', () => {
		test( 'should set disconnectingSite to true when disconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).toBe( true );
		} );

		test( 'should set disconnectingSite to false when site was disconnected', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).toBe( false );
		} );

		test( 'should set disconnectingSite to false when disconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).toBe( false );
		} );
	} );

	describe( '#unlinkUser', () => {
		test( 'should set unlinkingUser to true when unliking user', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).toBe( true );
		} );

		test( 'should set unlinkingUser to false when user was unlinked', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).toBe( false );
		} );

		test( 'should set unlinkingUser to false when unlinking a user failed', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).toBe( false );
		} );
	} );

	describe( '#fetchConnectUrl', () => {
		test( 'should set fetchingConnectUrl to true when fetching connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).toBe( true );
		} );

		test( 'should set fetchingConnectUrl to false when connect URL was fetched', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).toBe( false );
		} );

		test( 'should set fetchingConnectUrl to false when fecthing the connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).toBe( false );
		} );
	} );

	describe( '#fetchUSerConnectionData', () => {
		test( "should set fetchingUserData to true when fetching User's connection data", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).toBe( true );
		} );

		test( "should set fetchingUserData to false when User's connection data was fetched", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).toBe( false );
		} );

		test( "should set fetchingUserData to false when fecthing the User's connection data", () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).toBe( false );
		} );
	} );

	describe( '#connectUser', () => {
		test( 'should set isConnectingUser to true when connect', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_USER',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.connectingUser ).toBe( true );
		} );
	} );

	describe( '#reconnectSite', () => {
		test( 'should set reconnectingSite to true when reconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).toBe( true );
		} );

		test( 'should set reconnectingSite to false when site was reconnected', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_SUCCESS',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).toBe( false );
		} );

		test( 'should set reconnectingSite to false when reconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).toBe( false );
		} );
	} );
} );

describe( '#hasSeenWCConnectionModal', () => {
	test( 'should set hasSeenWCConnectionModal to true when', () => {
		const stateIn = {};
		const action = {
			type: 'JETPACK_CONNECTION_HAS_SEEN_WC_CONNECTION_MODAL',
		};
		const stateOut = hasSeenWCConnectionModal( stateIn, action );
		expect( stateOut ).toBe( true );
	} );
} );

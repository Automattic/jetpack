import { expect } from 'chai';

import {
	connectUrl as connectUrlReducer,
	status as statusReducer,
	user as userReducer,
	requests as requestsReducer,
	connectionRequests
} from '../reducer';

describe( 'status reducer', () => {
	describe( '#disconnectSite', () => {
		it( 'should set siteConnected to false when disconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS',
				siteConnected: false
			};
			let stateOut = statusReducer( stateIn, action );
			expect( stateOut.siteConnected ).to.be.false;
		} );

		it( 'should set siteConnected to action.siteConnected\'s value when fetching connection status', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_CONNECTION_STATUS_FETCH',
				siteConnected: true
			};
			let stateOut = statusReducer( stateIn, action );
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
		it( 'should set connectUrl to action.connectUrl\'s value when fetching connect url', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS',
				connectUrl: '/asdf'
			};
			let stateOut = connectUrlReducer( stateIn, action );
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
				userConnectionData: { a: 'b' }
			};
			let stateOut = userReducer( stateIn, action );
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
				type: 'DISCONNECT_SITE'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.true;
		} );

		it( 'should set disconnectingSite to false when site was disconnected', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.false;
		} );

		it( 'should set disconnectingSite to false when disconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'DISCONNECT_SITE_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.disconnectingSite ).to.be.false;
		} );
	} );

	describe( '#unlinkUser', () => {
		it( 'should set unlinkingUser to true when unliking user', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.true;
		} );

		it( 'should set unlinkingUser to false when user was unlinked', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.false;
		} );

		it( 'should set unlinkingUser to false when unlinking a user failed', () => {
			const stateIn = {};
			const action = {
				type: 'UNLINK_USER_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.unlinkingUser ).to.be.false;
		} );
	} );

	describe( '#fetchConnectUrl', () => {
		it( 'should set fetchingConnectUrl to true when fetching connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.true;
		} );

		it( 'should set fetchingConnectUrl to false when connect URL was fetched', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.false;
		} );

		it( 'should set fetchingConnectUrl to false when fecthing the connect URL', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_URL_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingConnectUrl ).to.be.false;
		} );
	} );

	describe( '#fetchUSerConnectionData', () => {
		it( 'should set fetchingUserData to true when fetching User\'s connection data', () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.true;
		} );

		it( 'should set fetchingUserData to false when User\'s connection data was fetched', () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.false;
		} );

		it( 'should set fetchingUserData to false when fecthing the User\'s connection data', () => {
			const stateIn = {};
			const action = {
				type: 'USER_CONNECTION_DATA_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingUserData ).to.be.false;
		} );
	} );

	describe( '#connectUser', () => {
		it( 'should set isConnectingUser to true when connect ', () => {
			const stateIn = {};
			const action = {
				type: 'CONNECT_USER'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.connectingUser ).to.be.true;
		} );
	} );

	describe( '#reconnectSite', () => {
		it( 'should set reconnectingSite to true when reconnecting site', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.true;
		} );

		it( 'should set reconnectingSite to false when site was reconnected', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_SUCCESS'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.false;
		} );

		it( 'should set reconnectingSite to false when reconnecting site failed', () => {
			const stateIn = {};
			const action = {
				type: 'SITE_RECONNECT_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.reconnectingSite ).to.be.false;
		} );
	} );
} );

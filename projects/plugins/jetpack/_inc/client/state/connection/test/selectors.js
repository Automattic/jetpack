import { expect } from 'chai';

import {
	isDisconnectingSite,
	isFetchingConnectUrl,
	isUnlinkingUser,
	isFetchingUserData,
	getSiteConnectionStatus,
	getConnectUrl,
	isCurrentUserLinked,
	isConnectingUser,
	isReconnectingSite,
} from '../reducer';

let state = {
	jetpack: {
		connection: {
			requests: {
				disconnectingSite: true,
				fetchingConnectUrl: false,
				unlinkingUser: true,
				fetchingUserData: true,
				connectingUser: true,
				reconnectingSite: true,
			},
			status: {
				siteConnected: {
					isActive: true,
					offlineMode: {
						isActive: false
					}
				}
			},
			connectUrl: '/asd',
			user: {
				currentUser: {
					isConnected: true
				}
			}
		},
	}
};

describe( 'requests selectors', () => {
	describe( '#isDisconnectingSite', () => {
		it( 'should return state.jetpack.connection.requests.disconnectingSite', () => {
			const stateIn = state;
			const output = isDisconnectingSite( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.disconnectingSite );
		} );
	} );

	describe( '#isReconnectingSite', () => {
		it( 'should return state.jetpack.connection.requests.reconnectingSite', () => {
			const stateIn = state;
			const output = isReconnectingSite( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.reconnectingSite );
		} );
	} );

	describe( '#isFetchingConnectUrl', () => {
		it( 'should return state.jetpack.connection.requests.fetchingConnectUrl', () => {
			const stateIn = state;
			const output = isFetchingConnectUrl( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.fetchingConnectUrl );
		} );
	} );

	describe( '#isUnlinkingUser', () => {
		it( 'should return state.jetpack.connection.requests.unlinkingUser', () => {
			const stateIn = state;
			const output = isUnlinkingUser( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.unlinkingUser );
		} );
	} );

	describe( '#fetchingUserData', () => {
		it( 'should return state.jetpack.connection.requests.fetchingUserData', () => {
			const stateIn = state;
			const output = isFetchingUserData( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.fetchingUserData );
		} );
	} );

	describe( '#isConnectingUser', () => {
		it( 'should return state.jetpack.connection.requests.connectingUser', () => {
			const stateIn = state;
			const output = isConnectingUser( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.requests.connectingUser );
		} );
	} );
} );

describe( 'status selectors', () => {
	describe( '#getSiteConnectionStatus', () => {
		it( 'should return state.jetpack.connection.status.siteConnected', () => {
			const stateIn = state;
			const output = getSiteConnectionStatus( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.status.siteConnected.isActive );
		} );
	} );
} );

describe( 'connectUrl selectors', () => {
	describe( '#getConnectUrl', () => {
		it( 'should return state.jetpack.connection.connectUrl', () => {
			const stateIn = state;
			const output = getConnectUrl( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.connectUrl );
		} );
	} );
} );

describe( 'user selectors', () => {
	describe( '#isCurrentUserLinked', () => {
		it( 'should return state.jetpack.connection.user.currentUser.isConnected', () => {
			const stateIn = state;
			const output = isCurrentUserLinked( stateIn );
			expect( output ).to.be.equal( state.jetpack.connection.user.currentUser.isConnected );
		} );
	} );
} );

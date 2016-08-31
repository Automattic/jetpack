import { expect } from 'chai';

import {
	isDisconnectingSite,
	isFetchingConnectUrl,
	isUnlinkingUser,
	isFetchingUserData,
	getSiteConnectionStatus,
	getConnectUrl,
	isCurrentUserLinked
} from '../reducer';

let state = {
	jetpack: {
		connection: {
			requests: {
				disconnectingSite: true,
				fetchingConnectUrl: false,
				unlinkingUser: true,
				fetchingUserData: true,
			},
			status: {
				siteConnected: {
					isActive: true,
					devMode: {
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

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
	getHasSeenWCConnectionModal,
} from '../reducer';

const state = {
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
						isActive: false,
					},
				},
			},
			connectUrl: '/asd',
			user: {
				currentUser: {
					isConnected: true,
				},
			},
			hasSeenWCConnectionModal: false,
		},
	},
};

describe( 'requests selectors', () => {
	describe( '#isDisconnectingSite', () => {
		test( 'should return state.jetpack.connection.requests.disconnectingSite', () => {
			const stateIn = state;
			const output = isDisconnectingSite( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.disconnectingSite );
		} );
	} );

	describe( '#isReconnectingSite', () => {
		test( 'should return state.jetpack.connection.requests.reconnectingSite', () => {
			const stateIn = state;
			const output = isReconnectingSite( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.reconnectingSite );
		} );
	} );

	describe( '#isFetchingConnectUrl', () => {
		test( 'should return state.jetpack.connection.requests.fetchingConnectUrl', () => {
			const stateIn = state;
			const output = isFetchingConnectUrl( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.fetchingConnectUrl );
		} );
	} );

	describe( '#isUnlinkingUser', () => {
		test( 'should return state.jetpack.connection.requests.unlinkingUser', () => {
			const stateIn = state;
			const output = isUnlinkingUser( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.unlinkingUser );
		} );
	} );

	describe( '#fetchingUserData', () => {
		test( 'should return state.jetpack.connection.requests.fetchingUserData', () => {
			const stateIn = state;
			const output = isFetchingUserData( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.fetchingUserData );
		} );
	} );

	describe( '#isConnectingUser', () => {
		test( 'should return state.jetpack.connection.requests.connectingUser', () => {
			const stateIn = state;
			const output = isConnectingUser( stateIn );
			expect( output ).toEqual( state.jetpack.connection.requests.connectingUser );
		} );
	} );
} );

describe( 'status selectors', () => {
	describe( '#getSiteConnectionStatus', () => {
		test( 'should return state.jetpack.connection.status.siteConnected', () => {
			const stateIn = state;
			const output = getSiteConnectionStatus( stateIn );
			expect( output ).toEqual( state.jetpack.connection.status.siteConnected.isActive );
		} );
	} );
} );

describe( 'connectUrl selectors', () => {
	describe( '#getConnectUrl', () => {
		test( 'should return state.jetpack.connection.connectUrl', () => {
			const stateIn = state;
			const output = getConnectUrl( stateIn );
			expect( output ).toEqual( state.jetpack.connection.connectUrl );
		} );
	} );
} );

describe( 'user selectors', () => {
	describe( '#isCurrentUserLinked', () => {
		test( 'should return state.jetpack.connection.user.currentUser.isConnected', () => {
			const stateIn = state;
			const output = isCurrentUserLinked( stateIn );
			expect( output ).toEqual( state.jetpack.connection.user.currentUser.isConnected );
		} );
	} );
} );

describe( 'getHasSeenWCConnectionModal selector', () => {
	describe( '#getHasSeenWCConnectionModal', () => {
		test( 'should return state.jetpack.connection.hasSeenWCConnectionModal', () => {
			const stateIn = state;
			const output = getHasSeenWCConnectionModal( stateIn );
			expect( output ).toEqual( state.jetpack.connection.hasSeenWCConnectionModal );
		} );
	} );
} );

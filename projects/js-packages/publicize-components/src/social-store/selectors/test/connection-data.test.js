import {
	getConnections,
	getConnectionsAdminUrl,
	hasConnections,
	getFailedConnections,
	getMustReauthConnections,
	getConnectionProfileDetails,
	getEnabledConnections,
	getDisabledConnections,
} from '../connection-data';

const state = {
	connectionData: {
		adminUrl: 'https://wordpress.com/some-url',
		connections: [
			{
				id: '123456789',
				service_name: 'facebook',
				display_name: 'Some name',
				profile_picture: 'https://wordpress.com/some-url-of-a-picture',
				username: 'username',
				enabled: false,
				connection_id: '987654321',
				test_success: true,
			},
			{
				id: '234567891',
				service_name: 'tumblr',
				display_name: 'Some name',
				profile_picture: 'https://wordpress.com/some-url-of-another-picture',
				username: 'username',
				enabled: true,
				connection_id: '198765432',
				test_success: false,
			},
			{
				id: '345678912',
				service_name: 'mastodon',
				display_name: 'somename',
				profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
				username: '@somename@mastodon.social',
				enabled: false,
				connection_id: '219876543',
				test_success: 'must_reauth',
			},
		],
	},
};

describe( 'Social store selectors: connectionData', () => {
	describe( 'getConnections', () => {
		it( 'should return empty array if no connections', () => {
			expect( getConnections( {} ) ).toEqual( [] );

			const connections = getConnections( {
				connectionData: {},
			} );
			expect( connections ).toEqual( [] );
		} );

		it( 'should return connections', () => {
			const connections = getConnections( state );
			expect( connections ).toEqual( state.connectionData.connections );
		} );
	} );

	describe( 'getConnectionsAdminUrl', () => {
		it( 'should return null if no adminUrl', () => {
			expect( getConnectionsAdminUrl( {} ) ).toBeNull();
		} );

		it( 'should return adminUrl', () => {
			const adminUrl = getConnectionsAdminUrl( state );
			expect( adminUrl ).toEqual( state.connectionData.adminUrl );
		} );
	} );

	describe( 'hasConnections', () => {
		it( 'should return false if no connections', () => {
			expect( hasConnections( {} ) ).toBe( false );
			expect( hasConnections( { connectionData: {} } ) ).toBe( false );
			expect( hasConnections( { connectionData: { connections: [] } } ) ).toBe( false );
		} );

		it( 'should return true if connections', () => {
			expect( hasConnections( state ) ).toBe( true );
		} );
	} );

	describe( 'getFailedConnections', () => {
		it( 'should return empty array if no connections', () => {
			expect( getFailedConnections( {} ) ).toEqual( [] );
		} );

		it( 'should return failed connections', () => {
			const failedConnections = getFailedConnections( state );
			expect( failedConnections ).toEqual( [ state.connectionData.connections[ 1 ] ] );
		} );
	} );

	describe( 'getMustReauthConnections', () => {
		it( 'should return empty array if no connections', () => {
			expect( getMustReauthConnections( {} ) ).toEqual( [] );
		} );

		it( 'should return must reauth connections', () => {
			const mustReauthConnections = getMustReauthConnections( state );
			expect( mustReauthConnections ).toEqual( [
				state.connectionData.connections[ 2 ].service_name,
			] );
		} );
	} );

	describe( 'getEnabledConnections', () => {
		it( 'should return empty array if no connections', () => {
			expect( getEnabledConnections( {} ) ).toEqual( [] );
		} );

		it( 'should return enabled connections', () => {
			const enabledConnections = getEnabledConnections( state );
			expect( enabledConnections ).toEqual( [ state.connectionData.connections[ 1 ] ] );
		} );
	} );

	describe( 'getDisabledConnections', () => {
		it( 'should return empty array if no connections', () => {
			expect( getDisabledConnections( {} ) ).toEqual( [] );
		} );

		it( 'should return disabled connections', () => {
			const disabledConnections = getDisabledConnections( state );
			expect( disabledConnections ).toEqual( [
				state.connectionData.connections[ 0 ],
				state.connectionData.connections[ 2 ],
			] );
		} );
	} );

	describe( 'getConnectionProfileDetails', () => {
		const defaultProfileDetails = {
			displayName: '',
			profileImage: '',
			username: '',
		};

		it( 'should return default values if no connections', () => {
			expect( getConnectionProfileDetails( {}, 'linkedin' ) ).toEqual( defaultProfileDetails );
		} );

		it( 'should return the profile details', () => {
			const connection = state.connectionData.connections[ 0 ];

			expect( getConnectionProfileDetails( state, 'facebook' ) ).toEqual( {
				displayName: connection.display_name,
				profileImage: connection.profile_picture,
				username: connection.username,
			} );
		} );

		it( 'should return default values if forced', () => {
			expect( getConnectionProfileDetails( state, 'facebook', { forceDefaults: true } ) ).toEqual(
				defaultProfileDetails
			);
		} );
	} );
} );

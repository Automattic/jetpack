import {
	getConnections,
	hasConnections,
	getFailedConnections,
	getMustReauthConnections,
	getEnabledConnections,
	getDisabledConnections,
} from '../connection-data';

const state = {
	connectionData: {
		connections: [
			{
				service_name: 'facebook',
				display_name: 'Some name',
				profile_picture: 'https://wordpress.com/some-url-of-a-picture',
				external_handle: 'external_handle',
				enabled: false,
				connection_id: '987654321',
				status: 'ok',
			},
			{
				service_name: 'tumblr',
				display_name: 'Some name',
				profile_picture: 'https://wordpress.com/some-url-of-another-picture',
				external_handle: 'external_handle',
				enabled: true,
				connection_id: '198765432',
				status: 'broken',
			},
			{
				service_name: 'mastodon',
				display_name: 'somename',
				profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
				external_handle: '@somename@mastodon.social',
				enabled: false,
				connection_id: '219876543',
				status: 'must_reauth',
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
} );

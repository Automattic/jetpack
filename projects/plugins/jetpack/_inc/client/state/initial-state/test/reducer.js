import { getFeatureUpgradeUrl, getPluginDeactivationData, isAiEnabled } from '../reducer';

describe( 'isAiEnabled', () => {
	const stateWith = initialState => ( { jetpack: { initialState } } );

	it( 'returns true when the server reports AI effectively enabled', () => {
		expect( isAiEnabled( stateWith( { isAiEnabled: true } ) ) ).toBe( true );
	} );

	it( 'returns false when the server reports AI effectively disabled', () => {
		expect( isAiEnabled( stateWith( { isAiEnabled: false } ) ) ).toBe( false );
	} );

	it( 'defaults to true when the server did not report the value', () => {
		expect( isAiEnabled( stateWith( {} ) ) ).toBe( true );
	} );
} );

describe( 'getPluginDeactivationData', () => {
	it( 'returns what the plugins page needs for the deactivation survey', () => {
		const pluginDeactivation = { siteId: 1234, hasConnectedUser: false };

		expect(
			getPluginDeactivationData( { jetpack: { initialState: { pluginDeactivation } } } )
		).toEqual( pluginDeactivation );
	} );

	it( 'is undefined outside the plugins page', () => {
		expect( getPluginDeactivationData( { jetpack: { initialState: {} } } ) ).toBeUndefined();
	} );
} );

describe( 'getFeatureUpgradeUrl', () => {
	const HOST_URL = 'https://wordpress.com/setup/plan-upgrade?feature=wordads-instant';
	const stateWith = hostUpgradeUrls => ( {
		jetpack: {
			initialState: {
				siteData: { blog_id: 1234, hostUpgradeUrls },
				userData: { currentUser: { id: 1 } },
			},
			connection: { user: { currentUser: { isConnected: true } } },
		},
	} );

	it.each( [
		[ 'the host plans the host names', HOST_URL, HOST_URL ],
		[ 'nowhere when the host sells nothing', '', '' ],
	] )( 'goes to %s', ( _name, hostUrl, expected ) => {
		expect(
			getFeatureUpgradeUrl( stateWith( { ads: hostUrl } ), 'ads', 'jetpack-creator-cta' )
		).toBe( expected );
	} );

	it( 'goes to Jetpack checkout when the host does not answer', () => {
		expect(
			getFeatureUpgradeUrl( stateWith( { ads: null } ), 'ads', 'jetpack-creator-cta' )
		).toContain( 'source=jetpack-creator-cta' );
	} );
} );

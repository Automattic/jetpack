import { getPluginDeactivationData, isAiEnabled } from '../reducer';

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

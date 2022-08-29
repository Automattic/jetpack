import fetchMock from 'fetch-mock-jest';
import restApi from '../index';

// mock out some values to make testing easier
restApi.setApiRoot( '/fakeApiRoot/' );
restApi.setCacheBusterCallback( route => {
	const parts = route.split( '?' ),
		query = parts.length > 1 ? parts[ 1 ] : '',
		args = query.length ? query.split( '&' ) : [];

	args.push( '_cacheBuster=1234' );

	return parts[ 0 ] + '?' + args.join( '&' );
} );

describe( 'restApi', () => {
	describe( 'GET requests', () => {
		beforeAll( () => {
			fetchMock.mock(
				{
					method: 'POST',
					url: /\/jetpack\/v4\/licensing\/attach-licenses/,
					name: 'attach-licenses',
				},
				JSON.stringify( [ { activatedProductId: 1 } ] )
			);
			fetchMock.mock(
				{ method: 'GET', url: /\/jetpack\/v4\/connection/, name: 'connection' },
				JSON.stringify( 'the body' )
			);
		} );

		it( 'returns an object with methods', () => {
			expect( typeof restApi ).toBe( 'object' );
			expect( restApi.setApiRoot ).toBeInstanceOf( Function );
		} );

		it( 'can fetchSiteConnectionStatus', async () => {
			const connectionStatus = await restApi.fetchSiteConnectionStatus();
			expect( connectionStatus ).toBe( 'the body' );
		} );

		it( 'can post attachLicenses', async () => {
			const results = await restApi.attachLicenses();
			expect( results ).toEqual( [ { activatedProductId: 1 } ] );
		} );
	} );
} );

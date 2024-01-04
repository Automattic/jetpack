import apiFetch from '@wordpress/api-fetch';
import API from './api';

jest.mock( '@wordpress/api-fetch' );

describe( 'API', () => {
	beforeEach( () => {
		API.initialize( { siteId: 123, authToken: 'ABC' } );

		window.JP_CONNECTION_INITIAL_STATE = {
			siteSuffix: 'test-site-id',
			apiNonce: 'test-nonce',
			connectionStatus: {
				isActive: true,
			},
		};
	} );

	afterEach( () => {
		API.destroyInstance();
		jest.clearAllMocks();
	} );

	it( 'initializes and destructs correctly', async () => {
		// Remove our default API instance.
		API.destroyInstance();

		// Initialize a new API instance with a siteId and authToken.
		API.initialize( { siteId: 111, authToken: '222' } );

		// Validate that the initialized values are used in API requests.
		await API.fetch( { endpoint: 'test-endpoint' } );
		expect( apiFetch ).toHaveBeenCalledWith( {
			endpoint: `/wpcom/v2/sites/111/test-endpoint`,
			method: 'GET',
			headers: {
				Authorization: 'Bearer 222',
			},
		} );

		// Reset the API instance.
		API.destroyInstance();

		// Validate that the siteId and authToken values were reset.
		await API.fetch( { endpoint: 'test-endpoint' } );
		expect( apiFetch ).toHaveBeenCalledWith( {
			endpoint: `/wpcom/v2/sites/test-site-id/test-endpoint`,
			method: 'GET',
			headers: {},
		} );
	} );

	it( 'overrides headers correctly', async () => {
		API.initialize( {
			siteId: 123,
			authToken: 'ABC',
			authHeaders: {
				Authorization: 'X-WPCOOKIE XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:1:https://wordpress.com',
				Cookie: 'test_cookie=1',
			},
		} );

		API.fetch( {
			endpoint: 'test-endpoint',
			options: {
				headers: {
					'no-cache': 'true',
				},
			},
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			endpoint: '/wpcom/v2/sites/123/test-endpoint',
			method: 'GET',
			headers: {
				Authorization: 'X-WPCOOKIE XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:1:https://wordpress.com',
				Cookie: 'test_cookie=1',
				'no-cache': 'true',
			},
		} );
	} );

	it( 'stringifies params correctly', async () => {
		const params = {
			stringParam: 'stringParam',
			numParam: 123,
			arrParam: [ 'a', 'b', 'c' ],
			objParam: { a: 'a', b: 'b' },
		};

		apiFetch.mockResolvedValueOnce( 'success_mock_fetch' );

		await API.fetch( {
			endpoint: 'test-endpoint',
			method: 'POST',
			params,
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			endpoint: `/wpcom/v2/sites/123/test-endpoint?stringParam=stringParam&numParam=123&arrParam%5B0%5D=a&arrParam%5B1%5D=b&arrParam%5B2%5D=c&objParam%5Ba%5D=a&objParam%5Bb%5D=b`,
			method: 'POST',
			headers: {
				Authorization: `Bearer ABC`,
			},
		} );
	} );

	it( 'fetch and apiFetch are called correctly', async () => {
		apiFetch.mockResolvedValueOnce( 'success_mock_fetch' );

		const fetchResult = await API.fetch( {
			endpoint: 'test-endpoint',
		} );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( fetchResult ).toBe( 'success_mock_fetch' );
	} );
} );

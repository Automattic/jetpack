import apiFetch from '@wordpress/api-fetch';

jest.mock( '../../../_inc/client/ai/main', () => () => null );

describe( 'AI Hub stage', () => {
	it( "leaves other dashboards' requests alone when the module is imported", async () => {
		window.jetpackAiSettings = {
			apiRoot: 'https://example.com/ai-root/',
			apiNonce: 'ai-hub-nonce',
		};
		const fetchHandler = jest.fn().mockResolvedValue( {} );
		apiFetch.setFetchHandler( fetchHandler );

		// What the admin shell's hover prewarm does.
		await import( '../stage' );
		await apiFetch( { path: '/other-dashboard/v1/data' } );

		const [ request ] = fetchHandler.mock.calls[ 0 ];
		expect( request.url ).toBeUndefined();
		expect( request.headers?.[ 'X-WP-Nonce' ] ).toBeUndefined();
	} );
} );

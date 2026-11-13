import assetUrl from '../asset-url';

describe( 'assetUrl', () => {
	afterEach( () => {
		delete window.jetpackAiSettings;
	} );

	test( 'builds a versioned URL under images/ai-hub/', () => {
		window.jetpackAiSettings = { pluginUrl: 'https://example.com/jetpack', assetsVersion: '1.2.3' };

		expect( assetUrl( 'upsell-illustration.svg' ) ).toBe(
			'https://example.com/jetpack/images/ai-hub/upsell-illustration.svg?ver=1.2.3'
		);
	} );

	test( 'does not double the separator when pluginUrl has a trailing slash', () => {
		window.jetpackAiSettings = {
			pluginUrl: 'https://example.com/jetpack/',
			assetsVersion: '1.2.3',
		};

		expect( assetUrl( 'upsell-illustration.svg' ) ).toBe(
			'https://example.com/jetpack/images/ai-hub/upsell-illustration.svg?ver=1.2.3'
		);
	} );

	test( 'omits the query when no version is available', () => {
		window.jetpackAiSettings = { pluginUrl: 'https://example.com/jetpack' };

		expect( assetUrl( 'upsell-illustration.svg' ) ).toBe(
			'https://example.com/jetpack/images/ai-hub/upsell-illustration.svg'
		);
	} );

	test( 'returns an empty string rather than a URL against the wrong origin', () => {
		expect( assetUrl( 'upsell-illustration.svg' ) ).toBe( '' );
	} );
} );

import { assetUrl } from '../url';

describe( 'assetUrl', () => {
	afterEach( () => {
		window.myJetpackInitialState = {} as Window[ 'myJetpackInitialState' ];
	} );

	it( 'joins the runtime base with the relative path', () => {
		window.myJetpackInitialState = {
			assetsUrl: 'https://example.com/wp-content/plugins/jetpack/build/images/',
		} as Window[ 'myJetpackInitialState' ];

		expect( assetUrl( 'components/connection-screen/connect.webp' ) ).toBe(
			'https://example.com/wp-content/plugins/jetpack/build/images/components/connection-screen/connect.webp'
		);
	} );

	it( 'tolerates a base without a trailing slash', () => {
		window.myJetpackInitialState = {
			assetsUrl: 'https://example.com/build/images',
		} as Window[ 'myJetpackInitialState' ];

		expect( assetUrl( 'components/a.png' ) ).toBe(
			'https://example.com/build/images/components/a.png'
		);
	} );

	it( 'returns the relative path unchanged when no base is present', () => {
		expect( assetUrl( 'components/a.png' ) ).toBe( 'components/a.png' );
	} );
} );

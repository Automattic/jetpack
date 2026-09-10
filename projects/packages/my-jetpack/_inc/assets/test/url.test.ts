import { assetUrl } from '../url';

describe( 'assetUrl', () => {
	afterEach( () => {
		window.myJetpackInitialState = {} as Window[ 'myJetpackInitialState' ];
		window.JetpackScriptData = {} as Window[ 'JetpackScriptData' ];
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

	it( 'falls back to the script data base off the My Jetpack page', () => {
		window.JetpackScriptData = {
			myJetpack: { assetsUrl: 'https://example.com/build/images/' },
		} as Window[ 'JetpackScriptData' ];

		expect( assetUrl( 'components/a.png' ) ).toBe(
			'https://example.com/build/images/components/a.png'
		);
	} );

	it( 'returns undefined when no base is present', () => {
		expect( assetUrl( 'components/a.png' ) ).toBeUndefined();
	} );
} );

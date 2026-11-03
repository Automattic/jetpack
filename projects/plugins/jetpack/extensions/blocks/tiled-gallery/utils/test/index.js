import { photonizedImgProps, skipPhotonDomain } from '..';

const IMAGE = {
	url: 'https://example.com/wp-content/uploads/2026/01/cat.jpg',
	width: 1200,
	height: 800,
};

/**
 * Set the script data global, the way the PHP inline script does on a page load.
 *
 * @param {object} jetpack - The `jetpack` section of the script data.
 */
function setScriptData( jetpack = {} ) {
	window.JetpackScriptData = { jetpack };
}

describe( 'skipPhotonDomain', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'is false when the script data is missing', () => {
		expect( skipPhotonDomain() ).toBe( false );
	} );

	it( 'is false when the script data does not flag it', () => {
		setScriptData( { flags: { showJetpackBranding: true } } );

		expect( skipPhotonDomain() ).toBe( false );
	} );

	// The value has to come from this global rather than an editor store: it feeds the blocks' save()
	// output, which is regenerated during block validation before any store holds editor settings.
	it( 'is true when the script data flags it', () => {
		setScriptData( { flags: { skipPhotonDomain: true } } );

		expect( skipPhotonDomain() ).toBe( true );
	} );
} );

describe( 'photonizedImgProps', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'routes images through the Photon domain by default', () => {
		const { src, srcSet } = photonizedImgProps( IMAGE );

		expect( src ).toBe( 'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg?ssl=1' );
		expect( srcSet ).toContain(
			'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg'
		);
	} );

	it( 'keeps images on the site host when the Photon domain is skipped', () => {
		setScriptData( { flags: { skipPhotonDomain: true } } );

		const { src, srcSet } = photonizedImgProps( IMAGE );

		expect( src ).toBe( 'https://example.com/wp-content/uploads/2026/01/cat.jpg' );
		expect( srcSet ).not.toContain( 'i0.wp.com' );
		expect( srcSet ).toContain(
			'https://example.com/wp-content/uploads/2026/01/cat.jpg?strip=info&w=600'
		);
	} );

	// Deprecated block versions pass this so they keep emitting the URLs they originally saved.
	it( 'stays on the Photon domain when the caller overrides the site setting', () => {
		setScriptData( { flags: { skipPhotonDomain: true } } );

		const { src, srcSet } = photonizedImgProps( IMAGE, {}, { skipPhotonDomain: false } );

		expect( src ).toBe( 'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg?ssl=1' );
		expect( srcSet ).toContain(
			'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg'
		);
	} );
} );

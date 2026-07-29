import { photonizedImgProps, skipPhotonDomain } from '..';

const IMAGE = {
	url: 'https://example.com/wp-content/uploads/2026/01/cat.jpg',
	width: 1200,
	height: 800,
};

/**
 * Set the editor initial state global, the way wp_localize_script() does on an editor page load.
 *
 * @param {object} jetpack - The `jetpack` section of the initial state.
 */
function setEditorInitialState( jetpack = {} ) {
	window.Jetpack_Editor_Initial_State = { jetpack };
}

describe( 'skipPhotonDomain', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'is false when the editor initial state is missing', () => {
		expect( skipPhotonDomain() ).toBe( false );
	} );

	it( 'is false when the initial state does not flag it', () => {
		setEditorInitialState( { jetpack_plan: { data: 'jetpack_free' } } );

		expect( skipPhotonDomain() ).toBe( false );
	} );

	// The value has to come from the initial state global rather than an editor store: it feeds the
	// blocks' save() output, which is regenerated during block validation before any store holds
	// editor settings.
	it( 'is true when the initial state flags it', () => {
		setEditorInitialState( { skip_photon_domain: true } );

		expect( skipPhotonDomain() ).toBe( true );
	} );
} );

describe( 'photonizedImgProps', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'routes images through the Photon domain by default', () => {
		const { src, srcSet } = photonizedImgProps( IMAGE );

		expect( src ).toBe( 'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg?ssl=1' );
		expect( srcSet ).toContain(
			'https://i0.wp.com/example.com/wp-content/uploads/2026/01/cat.jpg'
		);
	} );

	it( 'keeps images on the site host when the Photon domain is skipped', () => {
		setEditorInitialState( { skip_photon_domain: true } );

		const { src, srcSet } = photonizedImgProps( IMAGE );

		expect( src ).toBe( 'https://example.com/wp-content/uploads/2026/01/cat.jpg' );
		expect( srcSet ).not.toContain( 'i0.wp.com' );
		expect( srcSet ).toContain(
			'https://example.com/wp-content/uploads/2026/01/cat.jpg?strip=info&w=600'
		);
	} );
} );

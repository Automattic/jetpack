jest.mock( '../use-save-cookie-consent-settings', () => ( {
	useSaveCookieConsentSettings: jest.fn(),
} ) );

function loadEditor( screenBase ) {
	window.Jetpack_Editor_Initial_State = {
		screenBase,
		available_blocks: { 'cookie-consent': { available: true } },
	};

	let registration;
	jest.isolateModules( () => {
		const { getBlockType } = require( '@wordpress/blocks' );
		const { default: edit } = require( '../edit' );
		const { default: CookieConsentPreview } = require( '../preview' );
		require( '../editor' );
		registration = { block: getBlockType( 'jetpack/cookie-consent' ), edit, CookieConsentPreview };
	} );
	return registration;
}

describe( 'Cookie Consent editor registration', () => {
	const initialState = window.Jetpack_Editor_Initial_State;

	afterEach( () => {
		window.Jetpack_Editor_Initial_State = initialState;
	} );

	it( 'registers a read-only banner in the Page Editor without allowing insertion', () => {
		const { block, CookieConsentPreview } = loadEditor( 'post' );

		expect( block ).toMatchObject( { supports: { inserter: false } } );
		expect( block.edit ).toBe( CookieConsentPreview );
	} );

	it( 'allows editing and insertion of a single banner in the Site Editor', () => {
		const { block, edit } = loadEditor( 'site-editor' );

		expect( block ).toMatchObject( { supports: { inserter: true, multiple: false } } );
		expect( block.edit ).toBe( edit );
	} );
} );

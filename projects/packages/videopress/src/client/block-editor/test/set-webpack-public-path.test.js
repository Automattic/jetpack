/**
 * Tests for the block-editor Webpack public-path override, which runs as an
 * import-time side effect — each case arranges globals then re-requires it.
 */

describe( 'set-webpack-public-path', () => {
	beforeEach( () => {
		/*
		 * Webpack supplies this free variable in real builds; define it here so
		 * the module's strict-mode assignment resolves instead of throwing.
		 */
		global.__webpack_public_path__ = 'initial/';
		jest.resetModules();
	} );

	afterEach( () => {
		delete window.videoPressEditorState;
		delete global.__webpack_public_path__;
	} );

	test( 'sets the public path from the localized global when present', () => {
		window.videoPressEditorState = { webpackPublicPath: 'https://example.com/build/' };

		require( '../set-webpack-public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'https://example.com/build/' );
	} );

	test( 'leaves the public path unchanged when the localized global is absent', () => {
		delete window.videoPressEditorState;

		require( '../set-webpack-public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );

	test( 'leaves the public path unchanged when webpackPublicPath is empty', () => {
		window.videoPressEditorState = { webpackPublicPath: '' };

		require( '../set-webpack-public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );
} );

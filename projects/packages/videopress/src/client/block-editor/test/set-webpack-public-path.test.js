/**
 * Tests for the block-editor Webpack public-path override.
 *
 * The module runs a side effect at import time, so each case arranges globals
 * first and then re-requires it in isolation via `jest.resetModules()`.
 */

describe( 'set-webpack-public-path', () => {
	const originalEditorState = window.videoPressEditorState;

	beforeEach( () => {
		/*
		 * Provide a resolvable global so the module's assignment to Webpack's
		 * `__webpack_public_path__` free variable doesn't throw under strict
		 * mode. In the real build Webpack supplies this variable.
		 */
		global.__webpack_public_path__ = 'initial/';
		jest.resetModules();
	} );

	afterEach( () => {
		window.videoPressEditorState = originalEditorState;
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

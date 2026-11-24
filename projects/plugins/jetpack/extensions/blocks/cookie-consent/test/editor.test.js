import { render } from '@testing-library/react';
import { createElement } from '@wordpress/element';

jest.mock( '../use-save-cookie-consent-settings' );

function loadEditor( screenBase ) {
	window.Jetpack_Editor_Initial_State = {
		screenBase,
		available_blocks: { 'cookie-consent': { available: true } },
	};

	let editor;
	jest.isolateModules( () => {
		const { getBlockType } = require( '@wordpress/blocks' );
		const { getPlugin } = require( '@wordpress/plugins' );
		const { useSyncCookieConsentSettings } = require( '../use-save-cookie-consent-settings' );
		require( '../editor' );
		editor = {
			block: getBlockType( 'jetpack/cookie-consent' ),
			settingsPlugin: getPlugin( 'jetpack-cookie-consent-settings' ),
			useSyncCookieConsentSettings,
		};
	} );
	return editor;
}

describe( 'Cookie Consent editor registration', () => {
	const initialState = window.Jetpack_Editor_Initial_State;

	afterEach( () => {
		window.Jetpack_Editor_Initial_State = initialState;
	} );

	it( 'registers existing banners in the Page Editor without allowing insertion', () => {
		const { block, settingsPlugin, useSyncCookieConsentSettings } = loadEditor( 'post' );

		expect( block ).toMatchObject( { supports: { inserter: false } } );
		render( createElement( settingsPlugin.render ) );
		expect( useSyncCookieConsentSettings ).toHaveBeenCalled();
	} );

	it( 'allows insertion in the Site Editor without mounting the Page Editor settings plugin', () => {
		const { block, settingsPlugin } = loadEditor( 'site-editor' );

		expect( block ).toMatchObject( { supports: { inserter: true, multiple: false } } );
		expect( settingsPlugin ).toBeUndefined();
	} );
} );

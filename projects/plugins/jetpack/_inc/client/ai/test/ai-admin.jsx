import * as WPElement from '@wordpress/element';

jest.mock( '@wordpress/api-fetch', () => ( {
	createNonceMiddleware: jest.fn(),
	createRootURLMiddleware: jest.fn(),
	use: jest.fn(),
} ) );
jest.mock( '@wordpress/element', () => ( { createRoot: jest.fn() } ) );
jest.mock( '../main', () => () => null );

describe( 'AI admin entry point', () => {
	beforeEach( () => {
		WPElement.createRoot.mockReset();
		document.body.innerHTML = '<div id="jetpack-ai-root"></div>';
	} );

	test( 'reuses the root attached to the AI Hub container', () => {
		const root = { render: jest.fn() };
		WPElement.createRoot.mockReturnValue( root );

		require( '../../ai-admin' );
		jest.resetModules();
		const reloadedWPElement = require( '@wordpress/element' );
		require( '../../ai-admin' );

		expect( WPElement.createRoot ).toHaveBeenCalledTimes( 1 );
		expect( reloadedWPElement.createRoot ).not.toHaveBeenCalled();
		expect( root.render ).toHaveBeenCalledTimes( 2 );
	} );
} );

import * as WPElement from '@wordpress/element';
import analytics from 'lib/analytics';

jest.mock( '@wordpress/api-fetch', () => ( {
	createNonceMiddleware: jest.fn(),
	createRootURLMiddleware: jest.fn(),
	use: jest.fn(),
} ) );
jest.mock( '@wordpress/element', () => ( { createRoot: jest.fn() } ) );
jest.mock( '../main', () => () => null );
jest.mock( 'lib/analytics', () => ( { initialize: jest.fn() } ), { virtual: true } );

describe( 'AI admin entry point', () => {
	beforeEach( () => {
		WPElement.createRoot.mockReset();
		analytics.initialize.mockReset();
		delete window.jetpackAiSettings;
		document.body.innerHTML = '<div id="jetpack-ai-root"></div>';
	} );

	test( 'identifies the connected user for Tracks', () => {
		WPElement.createRoot.mockReturnValue( { render: jest.fn() } );
		window.jetpackAiSettings = { tracksUserData: { userid: 123, username: 'testuser' } };

		jest.isolateModules( () => require( '../../ai-admin' ) );

		expect( analytics.initialize ).toHaveBeenCalledWith( 123, 'testuser' );
	} );

	test( 'skips Tracks identification without a linked account', () => {
		WPElement.createRoot.mockReturnValue( { render: jest.fn() } );
		window.jetpackAiSettings = { tracksUserData: null };

		jest.isolateModules( () => require( '../../ai-admin' ) );

		expect( analytics.initialize ).not.toHaveBeenCalled();
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

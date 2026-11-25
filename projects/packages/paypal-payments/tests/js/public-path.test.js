/**
 * The public-path module runs on import, so each case sets the globals and then requires it.
 */

describe( 'public-path', () => {
	beforeEach( () => {
		// Webpack defines this in a build; defined here so the module can assign it.
		global.__webpack_public_path__ = 'initial/';
		jest.resetModules();
	} );

	afterEach( () => {
		delete window.jetpackPayPalPayments;
		delete global.__webpack_public_path__;
	} );

	test( 'sets the public path to assetsUrl', () => {
		window.jetpackPayPalPayments = { assetsUrl: 'https://example.com/dist/' };

		require( '../../src/paypal-payment-buttons/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'https://example.com/dist/' );
	} );

	test( 'keeps the default public path when window.jetpackPayPalPayments is missing', () => {
		delete window.jetpackPayPalPayments;

		require( '../../src/paypal-payment-buttons/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );

	test( 'keeps the default public path when assetsUrl is empty', () => {
		window.jetpackPayPalPayments = { assetsUrl: '' };

		require( '../../src/paypal-payment-buttons/public-path' );

		expect( global.__webpack_public_path__ ).toBe( 'initial/' );
	} );
} );

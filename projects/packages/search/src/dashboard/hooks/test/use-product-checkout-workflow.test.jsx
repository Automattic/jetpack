let mockConnection;

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	getProductCheckoutUrl: jest.fn(
		( productSlug, siteSuffix, _redirectUri, isConnected ) =>
			`https://wordpress.com/checkout/${ siteSuffix }/${ productSlug }?connected=${ isConnected }`
	),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: jest.fn( () => mockConnection ),
	useProductCheckoutWorkflow: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	select: () => ( {
		getWpcomUser: jest.fn( () => null ),
		getBlogId: jest.fn( () => 123 ),
		getVersion: jest.fn( () => '1.0.0' ),
	} ),
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );

import analytics from '@automattic/jetpack-analytics';
import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import {
	useConnection,
	useProductCheckoutWorkflow as useConnectionCheckoutWorkflow,
} from '@automattic/jetpack-connection';
import { act, renderHook } from '@testing-library/react';
import useProductCheckoutWorkflow from '../use-product-checkout-workflow';

const baseProps = {
	productSlug: 'jetpack_search_free',
	redirectUri: 'admin.php?page=jetpack-search',
	siteSuffix: 'example.com',
	blogID: 123,
	adminUrl: 'https://example.com/wp-admin/',
	from: 'jetpack-search',
};

describe( 'useProductCheckoutWorkflow', () => {
	let mockConnectedRun;

	beforeEach( () => {
		jest.clearAllMocks();
		mockConnectedRun = jest.fn();
		useConnectionCheckoutWorkflow.mockReturnValue( { run: mockConnectedRun } );
	} );

	it( 'routes an unregistered site through the connect-after-checkout flow', () => {
		mockConnection = { isRegistered: false, isUserConnected: false };

		const { result } = renderHook( () => useProductCheckoutWorkflow( baseProps ) );

		expect( useConnectionCheckoutWorkflow ).toHaveBeenCalledWith( {
			productSlug: baseProps.productSlug,
			redirectUrl: baseProps.redirectUri,
			siteSuffix: baseProps.siteSuffix,
			adminUrl: baseProps.adminUrl,
			from: baseProps.from,
			siteProductAvailabilityHandler: null,
			connectAfterCheckout: true,
			useBlogIdSuffix: true,
		} );

		act( () => result.current.run() );

		expect( mockConnectedRun ).toHaveBeenCalledTimes( 1 );
		expect( getProductCheckoutUrl ).not.toHaveBeenCalled();
		expect( result.current.isRegistered ).toBe( false );
	} );

	it( 'does not force connect-after-checkout for an already registered and connected site', () => {
		mockConnection = { isRegistered: true, isUserConnected: true };

		const { result } = renderHook( () => useProductCheckoutWorkflow( baseProps ) );

		expect( useConnectionCheckoutWorkflow ).toHaveBeenCalledWith(
			expect.objectContaining( { connectAfterCheckout: false } )
		);

		act( () => result.current.run() );

		expect( mockConnectedRun ).toHaveBeenCalledTimes( 1 );
		expect( result.current.isRegistered ).toBe( true );
	} );

	it( 'skips registration and the shared workflow entirely for WPCOM sites', () => {
		mockConnection = { isRegistered: false, isUserConnected: false };

		const { result } = renderHook( () =>
			useProductCheckoutWorkflow( { ...baseProps, isWpcom: true } )
		);

		// jsdom's `window.location.href` setter is locked (can't be spied/redefined),
		// so `run()` still actually assigns it, which jsdom surfaces as a "Not
		// implemented: navigation" console error. `@wordpress/jest-console`'s strict
		// guard requires that be explicitly acknowledged (an unhandled console.error
		// fails the test on its own) -- `toHaveErrored()` is that acknowledgement, not
		// a check on the navigation itself; `getProductCheckoutUrl`'s asserted args
		// below are the real signal for the built URL.
		act( () => result.current.run() );

		expect( mockConnectedRun ).not.toHaveBeenCalled();
		expect( getProductCheckoutUrl ).toHaveBeenCalledWith(
			'jetpack_search_free',
			123,
			'admin.php?page=jetpack-search',
			true
		);
		expect( console ).toHaveErrored();
		expect( result.current.isRegistered ).toBe( true );
	} );

	it( 'fires the purchase-button analytics event on run', () => {
		mockConnection = { isRegistered: false, isUserConnected: false };

		const { result } = renderHook( () => useProductCheckoutWorkflow( baseProps ) );

		act( () => result.current.run() );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_search_free_purchase_button_click',
			expect.objectContaining( { isWpcom: false } )
		);
	} );

	it( 'passes connection props through to useConnection', () => {
		mockConnection = { isRegistered: false, isUserConnected: false };

		renderHook( () => useProductCheckoutWorkflow( baseProps ) );

		expect( useConnection ).toHaveBeenCalledWith( {
			redirectUri: baseProps.redirectUri,
			from: baseProps.from,
		} );
	} );
} );

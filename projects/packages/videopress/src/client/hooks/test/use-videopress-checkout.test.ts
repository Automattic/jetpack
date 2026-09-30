import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { act, renderHook } from '@testing-library/react';
import { addQueryArgs } from '@wordpress/url';
import useVideoPressCheckout from '../use-videopress-checkout';

jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Keep navigation within jsdom while checking the destination and query arguments.
jest.mock( '@wordpress/url', () => ( { addQueryArgs: jest.fn( () => '#upgrade' ) } ) );

const props = {
	productSlug: 'jetpack_videopress',
	redirectUrl: 'admin.php?page=jetpack-videopress',
	useBlogIdSuffix: true,
	from: 'jetpack-videopress',
};

const mockRun = jest.fn();

const setSite = ( host: string, suffix = 'example.com' ) => {
	window.JetpackScriptData = {
		site: {
			host,
			is_wpcom_platform: host === 'wpcom' || host === 'woa',
			suffix,
			admin_url: 'https://example.com/wp-admin/',
		},
	} as typeof window.JetpackScriptData;
};

describe( 'useVideoPressCheckout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.history.replaceState( {}, '', '/' );
		jest.mocked( useProductCheckoutWorkflow ).mockReturnValue( {
			run: mockRun,
			isRegistered: true,
			hasCheckoutStarted: false,
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		delete window.JetpackScriptData;
	} );

	it.each( [ 'wpcom', 'woa' ] )( 'upgrades %s sites to Business', host => {
		setSite( host );
		const event = { preventDefault: jest.fn() };
		const { result } = renderHook( () => useVideoPressCheckout( props ) );

		act( () => result.current.run( event ) );

		expect( addQueryArgs ).toHaveBeenCalledWith( 'https://wordpress.com/plans/example.com', {
			plan: 'business-bundle',
			feature: 'videopress',
			redirect_to: 'https://example.com/wp-admin/admin.php?page=jetpack-videopress',
		} );
		expect( window.location.hash ).toBe( '#upgrade' );
		expect( event.preventDefault ).toHaveBeenCalledTimes( 1 );
		expect( result.current.hasCheckoutStarted ).toBe( true );
		expect( mockRun ).not.toHaveBeenCalled();
	} );

	it.each( [ 'unknown', 'pressable', 'atomic' ] )(
		'preserves standalone checkout on %s hosts',
		host => {
			setSite( host );
			const event = { preventDefault: jest.fn() };
			const redirect = 'https://example.com/wp-admin/admin.php?page=jetpack-videopress';
			const { result } = renderHook( () => useVideoPressCheckout( props ) );

			act( () => result.current.run( event, redirect ) );

			expect( useProductCheckoutWorkflow ).toHaveBeenCalledWith( props );
			expect( mockRun ).toHaveBeenCalledWith( event, redirect );
			expect( addQueryArgs ).not.toHaveBeenCalled();
		}
	);

	it( 'uses the supplied site suffix and post-upgrade redirect', () => {
		setSite( 'woa' );
		const redirect = 'https://example.com/wp-admin/admin.php?page=jetpack-videopress#/library';
		const { result } = renderHook( () =>
			useVideoPressCheckout( { ...props, siteSuffix: '12345' } )
		);

		act( () => result.current.run( undefined, redirect ) );

		expect( addQueryArgs ).toHaveBeenCalledWith(
			'https://wordpress.com/plans/12345',
			expect.objectContaining( { redirect_to: redirect } )
		);
	} );

	it( 'falls back to the plans picker when the site suffix is missing', () => {
		setSite( 'wpcom', '' );
		const { result } = renderHook( () => useVideoPressCheckout( props ) );

		act( () => result.current.run() );

		expect( addQueryArgs ).toHaveBeenCalledWith(
			'https://wordpress.com/plans',
			expect.any( Object )
		);
		expect( mockRun ).not.toHaveBeenCalled();
	} );
} );

import { renderHook } from '@testing-library/react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProductStatusAction from '../use-product-status-action';

const mockUseProduct = jest.fn();
const mockNavigate = jest.fn();
const mockActivate = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getJetpackAdminPageUrl: () => 'https://example.org/wp-admin/admin.php?page=jetpack',
	getMyJetpackUrl: () => 'https://example.org/wp-admin/admin.php?page=my-jetpack',
} ) );
jest.mock( '../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => mockUseProduct(),
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => {
	const result = { data: { ownedProducts: [] } };
	return { __esModule: true, default: () => result };
} );
jest.mock( '../../../hooks/use-forced-off-reason', () => {
	const result = { reason: null, isPending: false };
	return { __esModule: true, default: () => result };
} );
jest.mock( '../../../data/products/use-activate-plugins', () => {
	const result = { activate: () => mockActivate(), isPending: false };
	return { __esModule: true, default: () => result };
} );
jest.mock( '../../../data/products/use-install-plugins', () => {
	const result = { install: () => {}, isPending: false };
	return { __esModule: true, default: () => result };
} );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => {
	const result = { siteIsRegistering: false, isRegistered: true, isUserConnected: false };
	return { __esModule: true, default: () => result };
} );
jest.mock( '../../../hooks/use-my-jetpack-navigate', () => ( {
	__esModule: true,
	default: ( route: string ) => () => mockNavigate( route ),
} ) );

const withStatus = ( status: string, isActivated = false ) =>
	mockUseProduct.mockReturnValue( {
		detail: { status, isActivated, requiresUserConnection: true },
		isLoading: false,
		isRefetching: false,
	} );

const connectUrlParams = ( href: string ) => new URL( href ).searchParams;

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'useProductStatusAction connect links', () => {
	it.each( [
		[ 'the product name by default', undefined, 'my_jetpack_products_backup' ],
		[
			'the name a caller passes',
			{ from: 'my_jetpack_overview_backup' },
			'my_jetpack_overview_backup',
		],
	] )( '"Connect" sends %s and returns to the current page', ( _, options, from ) => {
		withStatus( PRODUCT_STATUSES.USER_CONNECTION_ERROR );
		const { result } = renderHook( () => useProductStatusAction( 'backup', options ) );

		const params = connectUrlParams( result.current.action.href );
		expect( params.get( 'from' ) ).toBe( from );
		expect( params.get( 'redirect_after_auth' ) ).toBe( window.location.href );
	} );

	it.each( [
		[ 'the product name by default', undefined, 'my_jetpack_products_backup' ],
		[
			'the name a caller passes',
			{ from: 'my_jetpack_overview_backup' },
			'my_jetpack_overview_backup',
		],
	] )( '"Activate" opens the connection screen with %s', ( _, options, from ) => {
		withStatus( PRODUCT_STATUSES.INACTIVE );
		const { result } = renderHook( () => useProductStatusAction( 'backup', options ) );

		result.current.action.onClick( undefined );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith( `/connection?from=${ from }&skip_pricing=true` );
	} );
} );

describe( 'useProductStatusAction without an account', () => {
	it.each( [
		[ 'search', true, true, 'View' ],
		[ 'videopress', false, true, 'Activate' ],
		[ 'backup', true, true, 'Connect' ],
		[ 'search', true, false, 'Connect' ],
	] )(
		'%s, switched on: %s, showing its state: %s, offers %s',
		( slug, isActivated, showStateWithoutAccount, label ) => {
			withStatus( PRODUCT_STATUSES.USER_CONNECTION_ERROR, isActivated );
			const { result } = renderHook( () =>
				useProductStatusAction( slug as JetpackModule, { showStateWithoutAccount } )
			);

			expect( result.current.action.label ).toBe( label );
		}
	);

	it( '"Activate" switches the product on instead of asking for an account', () => {
		withStatus( PRODUCT_STATUSES.USER_CONNECTION_ERROR );
		const { result } = renderHook( () =>
			useProductStatusAction( 'search', { showStateWithoutAccount: true } )
		);

		result.current.action.onClick( undefined );

		expect( mockActivate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).not.toHaveBeenCalled();
	} );
} );

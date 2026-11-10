import { renderHook } from '@testing-library/react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProductStatusAction from '../use-product-status-action';

const mockUseProduct = jest.fn();
const mockNavigate = jest.fn();

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
	const result = { activate: () => {}, isPending: false };
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
jest.mock( '../../../hooks/use-analytics', () => {
	const result = { recordEvent: () => {} };
	return { __esModule: true, default: () => result };
} );

const withStatus = ( status: string ) =>
	mockUseProduct.mockReturnValue( {
		detail: { status, requiresUserConnection: true },
		isLoading: false,
		isRefetching: false,
	} );

const connectUrlParams = ( href: string ) => new URL( href ).searchParams;

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'useProductStatusAction connect links', () => {
	it( 'sends the product name from "Connect" and returns to the current page', () => {
		withStatus( PRODUCT_STATUSES.USER_CONNECTION_ERROR );
		const { result } = renderHook( () => useProductStatusAction( 'backup' ) );

		const params = connectUrlParams( result.current.action.href );
		expect( params.get( 'from' ) ).toBe( 'my_jetpack_products_backup' );
		expect( params.get( 'redirect_after_auth' ) ).toBe( window.location.href );
	} );

	it( 'opens the connection screen with the product name from "Activate"', () => {
		withStatus( PRODUCT_STATUSES.INACTIVE );
		const { result } = renderHook( () => useProductStatusAction( 'jetpack-ai' ) );

		result.current.action.onClick( undefined );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith(
			'/connection?from=my_jetpack_products_ai&skip_pricing=true'
		);
	} );

	it( 'sends the name a caller passes from "Connect"', () => {
		withStatus( PRODUCT_STATUSES.USER_CONNECTION_ERROR );
		const { result } = renderHook( () =>
			useProductStatusAction( 'backup', { from: 'my_jetpack_overview_backup' } )
		);

		expect( connectUrlParams( result.current.action.href ).get( 'from' ) ).toBe(
			'my_jetpack_overview_backup'
		);
	} );

	it( 'opens the connection screen with the name a caller passes from "Activate"', () => {
		withStatus( PRODUCT_STATUSES.INACTIVE );
		const { result } = renderHook( () =>
			useProductStatusAction( 'backup', { from: 'my_jetpack_overview_backup' } )
		);

		result.current.action.onClick( undefined );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate ).toHaveBeenCalledWith(
			'/connection?from=my_jetpack_overview_backup&skip_pricing=true'
		);
	} );
} );

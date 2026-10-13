import { renderHook, act } from '@testing-library/react';
import { PRODUCT_STATUSES } from '../../../constants';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import useActivateSearchFreeProduct from '../../../data/products/use-activate-search-free-product';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useProduct from '../../../data/products/use-product';
import usePricingData from '../use-pricing-data';
import type { ProductCamelCase } from '../../../data/types';

jest.mock( '../../../data/products/use-activate-plugins' );
jest.mock( '../../../data/products/use-activate-search-free-product' );
jest.mock( '../../../data/products/use-install-plugins' );
jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( { isUserConnected: true } ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {
		myJetpackUrl: 'https://example.org/wp-admin/admin.php?page=my-jetpack',
		siteSuffix: 'example.org',
	} ),
} ) );

let mockRunFreeCheckout: jest.Mock;
jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.org/connect',
	useProductCheckoutWorkflow: () => ( { run: mockRunFreeCheckout } ),
} ) );

const mockUseProduct = useProduct as jest.MockedFunction< typeof useProduct >;
const mockUseActivatePlugins = useActivatePlugins as jest.MockedFunction<
	typeof useActivatePlugins
>;
const mockUseInstallPlugins = useInstallPlugins as jest.MockedFunction< typeof useInstallPlugins >;
const mockUseActivateSearchFreeProduct = useActivateSearchFreeProduct as jest.MockedFunction<
	typeof useActivateSearchFreeProduct
>;

let activate: jest.Mock;
let runSearchFreeActivation: jest.Mock;

/**
 * Build a product detail for a *feature* product — one whose card offers Activate rather than
 * Purchase. Search is not one today, which is why the branch under test cannot be reached
 * through the real card; see the note on the Search case below.
 *
 * Only the fields this hook reads are set, so the result is cast rather than fully built.
 *
 * @param {object} overrides - Fields to override on the detail.
 * @return {object} The product detail.
 */
const featureDetail = ( overrides = {} ) =>
	( {
		slug: 'search',
		isFeature: true,
		status: PRODUCT_STATUSES.MODULE_DISABLED,
		isUpgradableByBundle: [],
		isUpgradable: false,
		isPluginActive: true,
		hasFreeOffering: true,
		tiers: [],
		manageUrl: 'https://example.org/manage',
		pricingForUi: { wpcomFreeProductSlug: 'jetpack_search_free' },
		...overrides,
	} ) as unknown as ProductCamelCase;

/**
 * Wrap a detail in the full shape useProduct returns.
 *
 * @param {object} detail - The product detail.
 * @return {object} The hook's return value.
 */
const productState = ( detail: ProductCamelCase ) => ( {
	detail,
	refetch: () => Promise.resolve(),
	isLoading: false,
	isRefetching: false,
} );

beforeEach( () => {
	jest.clearAllMocks();
	activate = jest.fn();
	runSearchFreeActivation = jest.fn();
	mockRunFreeCheckout = jest.fn();

	mockUseActivatePlugins.mockReturnValue( {
		activate,
		isPending: false,
		isSuccess: false,
	} as unknown as ReturnType< typeof useActivatePlugins > );
	mockUseInstallPlugins.mockReturnValue( {
		install: jest.fn(),
		isPending: false,
	} as unknown as ReturnType< typeof useInstallPlugins > );
	mockUseActivateSearchFreeProduct.mockReturnValue( {
		run: runSearchFreeActivation,
		isPending: false,
	} );
} );

describe( 'usePricingData activation routing', () => {
	test( 'a product with no free product slug activates directly', () => {
		mockUseProduct.mockReturnValue(
			productState( featureDetail( { slug: 'boost', pricingForUi: {} } ) )
		);

		const { result } = renderHook( () => usePricingData( 'boost' ) );
		act( () => result.current.primaryAction.onClick() );

		expect( activate ).toHaveBeenCalled();
		expect( mockRunFreeCheckout ).not.toHaveBeenCalled();
		expect( runSearchFreeActivation ).not.toHaveBeenCalled();
	} );

	test( 'a non-Search product with a free product slug still buys it at $0', () => {
		mockUseProduct.mockReturnValue( productState( featureDetail( { slug: 'stats' } ) ) );

		const { result } = renderHook( () => usePricingData( 'stats' ) );
		act( () => result.current.primaryAction.onClick() );

		expect( mockRunFreeCheckout ).toHaveBeenCalled();
		expect( runSearchFreeActivation ).not.toHaveBeenCalled();
	} );

	test( 'Search grants its free product in place rather than going to checkout', () => {
		/*
		 * This configuration does not occur today: the branch needs `isFeature` to reach
		 * handleActivate at all, and Search never sets it (Product::$is_feature defaults to
		 * false and only five products override it). The branch is kept for a possible future
		 * where Search becomes a feature product, and this pins what it should do if it does.
		 */
		mockUseProduct.mockReturnValue( productState( featureDetail() ) );

		const { result } = renderHook( () => usePricingData( 'search' ) );
		act( () => result.current.primaryAction.onClick() );

		expect( runSearchFreeActivation ).toHaveBeenCalled();
		expect( mockRunFreeCheckout ).not.toHaveBeenCalled();
	} );

	test( 'an in-flight grant reports as activating, so the card can stay disabled', () => {
		mockUseProduct.mockReturnValue( productState( featureDetail() ) );
		mockUseActivateSearchFreeProduct.mockReturnValue( {
			run: runSearchFreeActivation,
			isPending: true,
		} );

		const { result } = renderHook( () => usePricingData( 'search' ) );

		expect( result.current.isActivating ).toBe( true );
	} );
} );

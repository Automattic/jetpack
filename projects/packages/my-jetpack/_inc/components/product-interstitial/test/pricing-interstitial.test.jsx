/**
 * Covers the Search free tier, which activates the product in place instead of going to the
 * $0 checkout the other products still use.
 */
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import useActivateSearchFreeProduct from '../../../data/products/use-activate-search-free-product';
import useProduct from '../../../data/products/use-product';
import PricingInterstitial from '../pricing-interstitial';

jest.mock( '../../../data/products/use-activate-plugins' );
jest.mock( '../../../data/products/use-activate-search-free-product' );
jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-go-back', () => ( {
	useGoBack: () => ( { onClickGoBack: jest.fn() } ),
} ) );
jest.mock( '../../../hooks/use-my-jetpack-navigate', () => () => jest.fn() );
jest.mock( '../reload-after-activation', () => ( {
	reloadIfActivationChangesAdminMenu: () => true,
} ) );

// jest.mock factories are hoisted, so anything they close over must be `mock`-prefixed.
let mockUpdateInterstitialsState;
jest.mock( '../../../hooks/use-interstitials-state', () => ( {
	useInterstitialsState: () => ( { update: mockUpdateInterstitialsState } ),
} ) );

jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {
	siteIsRegistering: false,
	handleRegisterSite: () => Promise.resolve( null ),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	useProductCheckoutWorkflow: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { admin_url: 'https://example.org/wp-admin/', suffix: 'example.org' },
	} ),
	getMyJetpackUrl: () => 'https://example.org/wp-admin/admin.php?page=my-jetpack',
} ) );

jest.mock( '../config', () => ( {
	getProductConfigs: () => ( {
		search: {
			title: 'Search',
			logo: null,
			bundle: 'complete',
			features: [],
			tiers: {
				free: { name: 'Free', cta: 'Start for free' },
				paid: { name: 'Search', cta: 'Get Search' },
				bundle: { name: 'Complete', cta: 'Get Complete' },
			},
		},
	} ),
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div>{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	PricingTable: ( { children } ) => <div>{ children }</div>,
	PricingTableColumn: ( { children } ) => <div>{ children }</div>,
	PricingTableHeader: ( { children } ) => <div>{ children }</div>,
	PricingTableItem: () => <div />,
	ProductPrice: () => <div />,
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Button: ( { children, onClick, disabled } ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	LinkButton: ( { children } ) => <a href="https://example.org">{ children }</a>,
} ) );

jest.mock( '@wordpress/components', () => ( { Spinner: () => <div /> } ) );
jest.mock( '../product-interstitial', () => () => <div data-testid="legacy-interstitial" /> );
jest.mock( '../../go-back-link', () => () => <div /> );

const POST_ACTIVATION_URL = 'https://example.org/wp-admin/admin.php?page=jetpack-search';

const searchDetail = {
	slug: 'search',
	title: 'Jetpack Search',
	isBundle: false,
	isUpgradable: false,
	isUpgradableByBundle: [],
	hasPaidPlanForProduct: false,
	postActivationUrl: POST_ACTIVATION_URL,
	pricingForUi: {
		currencyCode: 'USD',
		fullPricePerMonth: 10,
		discountPricePerMonth: 10,
		// The free tier still needs "buying" upstream, which is what routes it through the
		// checkout slot that Search now fills with an in-place grant.
		wpcomFreeProductSlug: 'jetpack_search_free',
		wpcomProductSlug: 'jetpack_search',
		tiers: { free: { isFree: false } },
	},
};

let activate;
let runSearchFreeActivation;
let freeCheckoutRun;
let searchFreeIsPending;

beforeEach( () => {
	jest.clearAllMocks();
	searchFreeIsPending = false;

	// Runs the caller's onSettled synchronously with the shape a settled activation returns.
	activate = jest.fn( ( _vars, options ) =>
		options?.onSettled?.( { post_checkout_url: POST_ACTIVATION_URL } )
	);
	runSearchFreeActivation = jest.fn();
	mockUpdateInterstitialsState = jest.fn( ( _state, options ) => options?.onSettled?.() );
	freeCheckoutRun = jest.fn();

	useProduct.mockReturnValue( { detail: searchDetail, isLoading: false } );
	useActivatePlugins.mockReturnValue( { activate, isPending: false } );
	useActivateSearchFreeProduct.mockImplementation( () => ( {
		run: runSearchFreeActivation,
		isPending: searchFreeIsPending,
	} ) );
	useProductCheckoutWorkflow.mockImplementation( () => ( { run: freeCheckoutRun } ) );
} );

describe( 'PricingInterstitial free tier for Search', () => {
	test( 'grants the product in place instead of running the $0 checkout', async () => {
		render( <PricingInterstitial slug="search" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Start for free' } ) );

		expect( runSearchFreeActivation ).toHaveBeenCalled();
		expect( freeCheckoutRun ).not.toHaveBeenCalled();
	} );

	test( 'hands the product-specific redirect to the checkout fallback, not just to success', async () => {
		render( <PricingInterstitial slug="search" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Start for free' } ) );

		// Without checkoutRedirect the fallback lands on the generic My Jetpack page, losing
		// the post-activation destination the non-Search path passes to checkout directly.
		expect( runSearchFreeActivation ).toHaveBeenCalledWith(
			expect.objectContaining( { checkoutRedirect: POST_ACTIVATION_URL } )
		);
	} );

	test( 'keeps every tier button disabled while the grant is still in flight', () => {
		searchFreeIsPending = true;

		render( <PricingInterstitial slug="search" /> );

		// The grant is a second async leg the plugin-activation mutation knows nothing about,
		// so a reset that only watched that one would re-enable these mid-request.
		screen.getAllByRole( 'button' ).forEach( button => expect( button ).toBeDisabled() );
	} );
} );

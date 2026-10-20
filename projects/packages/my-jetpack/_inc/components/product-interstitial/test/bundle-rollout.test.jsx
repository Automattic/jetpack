import { render, screen } from '@testing-library/react';
import useProduct from '../../../data/products/use-product';
import { GrowthInterstitial, ProInterstitial, SecurityInterstitial } from '../index';
import ProductInterstitial from '../product-interstitial';

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../assets/url', () => ( {
	assetUrl: relativePath => `https://example.com/assets/build/${ relativePath }`,
} ) );
jest.mock( '../pricing-interstitial', () => () => null );
jest.mock( 'react-router', () => ( {
	Navigate: ( { to } ) => (
		<span data-testid="redirect">{ typeof to === 'string' ? to : to.pathname + to.search }</span>
	),
	useLocation: () => ( { search: '?feature=backup' } ),
} ) );
jest.mock( '../../../data/products/use-activate-plugins', () => () => ( {} ) );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-go-back', () => ( { useGoBack: () => ( {} ) } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {} ) );
jest.mock( '../../../hooks/use-my-jetpack-navigate', () => () => jest.fn() );
jest.mock( '../../go-back-link', () => () => null );
jest.mock( '../../my-jetpack-tab-panel/utils', () => ( {
	getFeatureCheckoutReturnUrl: () => '',
} ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div>{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	TermsOfService: () => null,
} ) );
jest.mock( '@wordpress/ui', () => ( { ButtonLink: () => null } ) );
jest.mock( '../../product-detail-card', () => ( { slug, isUpsell } ) => (
	<span data-testid={ isUpsell ? 'bundle' : 'product' }>{ slug }</span>
) );

describe.each( [
	[ 'security', SecurityInterstitial ],
	[ 'growth', GrowthInterstitial ],
] )( 'retired %s purchase route', ( slug, Component ) => {
	it.each( [
		[ true, false, false, null, null ],
		[ false, false, false, 'pro', '/add-pro?feature=backup' ],
		[ false, false, false, 'complete', '/add-complete?feature=backup' ],
		[ false, true, false, 'pro', null ],
		[ false, false, true, 'pro', null ],
		[ false, false, false, null, null ],
	] )(
		'availability %s, owner %s, loading %s, replacement %s',
		( available, owned, isLoading, replacement, destination ) => {
			useProduct.mockImplementation( product => ( {
				detail: {
					title: product,
					isUpgradableByBundle: [],
					pricingForUi: { available: product === slug ? available : true },
					hasPaidPlanForProduct: owned,
					purchaseReplacement: replacement ? { slug: replacement } : null,
				},
				isLoading,
			} ) );
			render( <Component /> );
			expect( screen.queryByTestId( 'redirect' )?.textContent ?? null ).toBe( destination );
			expect( screen.queryByTestId( 'product' )?.textContent ?? null ).toBe(
				destination ? null : slug
			);
		}
	);
} );

it( 'keeps the Pro page mounted but hidden while its availability is refreshing', () => {
	useProduct.mockImplementation( slug => ( {
		detail: {
			title: slug,
			isUpgradableByBundle: [],
			pricingForUi: { catalogAvailable: false, available: false },
			hasPaidPlanForProduct: false,
		},
		isLoading: false,
		isRefetching: true,
	} ) );
	render( <ProInterstitial /> );
	expect( screen.queryByTestId( 'redirect' ) ).not.toBeInTheDocument();
	expect( screen.getByTestId( 'product' ) ).not.toBeVisible();
} );

it.each( [
	[ false, false, 'security' ],
	[ true, true, 'pro' ],
	[ true, false, 'complete' ],
	[ undefined, true, 'security' ],
	[ 'yes', true, 'security' ],
] )(
	'selects %s/%s from the shared gate and customer eligibility',
	( catalogAvailable, available, expected ) => {
		useProduct.mockImplementation( slug => ( {
			detail:
				slug === 'pro'
					? { pricingForUi: { catalogAvailable, available } }
					: { title: slug, isUpgradableByBundle: [], pricingForUi: { available: true } },
		} ) );
		render( <ProductInterstitial slug="scan" bundle="security" /> );
		expect( screen.getByTestId( 'bundle' ) ).toHaveTextContent( expected );
	}
);

it.each( [
	[ false, 'complete', 'complete' ],
	[ true, 'complete', 'security' ],
	[ false, null, null ],
] )(
	'selects rollback content for owner %s with replacement %s',
	( owned, replacement, expected ) => {
		useProduct.mockImplementation( slug => ( {
			detail: {
				title: slug,
				isUpgradableByBundle: [],
				pricingForUi: { catalogAvailable: false, available: false },
				hasPaidPlanForProduct: slug === 'security' && owned,
				purchaseReplacement: replacement ? { slug: replacement } : null,
			},
		} ) );
		render(
			<ProductInterstitial slug="scan" bundle="security">
				<span data-testid="illustration">Illustration</span>
			</ProductInterstitial>
		);
		expect( screen.queryByTestId( 'bundle' )?.textContent ?? null ).toBe( expected );
		expect( Boolean( screen.queryByTestId( 'illustration' ) ) ).toBe( expected === null );
	}
);

it.each( [
	[ false, false, false, true ],
	[ true, false, false, false ],
	[ false, true, false, false ],
	[ false, false, true, false ],
] )(
	'protects the Pro route for rollout %s, offer %s, owner %s',
	( catalogAvailable, available, hasPaidPlanForProduct, redirects ) => {
		useProduct.mockImplementation( slug => ( {
			detail: {
				title: slug,
				isUpgradableByBundle: [],
				pricingForUi: { catalogAvailable, available },
				hasPaidPlanForProduct,
			},
			isLoading: false,
		} ) );
		render( <ProInterstitial /> );
		expect( Boolean( screen.queryByTestId( 'redirect' ) ) ).toBe( redirects );
		expect( screen.getByTestId( redirects ? 'redirect' : 'product' ) ).toHaveTextContent(
			redirects ? '/' : 'pro'
		);
	}
);

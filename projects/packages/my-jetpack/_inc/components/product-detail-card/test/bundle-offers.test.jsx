import { getIconBySlug } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import ProductDetailCard from '../index';

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-redirect-to-referrer', () => ( {
	useRedirectToReferrer: () => null,
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: jest.fn(),
} ) );
jest.mock( '../../my-jetpack-tab-panel/utils', () => ( {
	getFeatureCheckoutReturnUrl: () => '',
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	useProductCheckoutWorkflow: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	Text: ( { component: Component, children, ...props } ) => (
		<Component { ...props }>{ children }</Component>
	),
	TermsOfService: () => null,
	getIconBySlug: jest.fn( slug => ( slug === 'jetpack-ai' ? null : () => null ) ),
	getRedirectUrl: jest.fn( slug => `https://jetpack.com/redirect/?source=${ slug }` ),
} ) );
jest.mock( '@wordpress/ui', () => ( {
	...jest.requireActual( '@wordpress/ui' ),
	Text: ( { render: element } ) => element,
	Link: ( { children, href } ) => <a href={ href }>{ children }</a>,
} ) );
jest.mock( '../../product-detail-button', () => ( { children, onClick, disabled } ) => (
	<button onClick={ onClick } disabled={ disabled }>
		{ children }
	</button>
) );

const terms = [
	{
		available: true,
		wpcomProductSlug: 'jetpack_pro_yearly',
		productTerm: 'year',
		currencyCode: 'USD',
		fullPrice: 348,
		discountPrice: 348,
		fullPricePerMonth: 29,
		discountPricePerMonth: 29,
	},
	{
		available: true,
		wpcomProductSlug: 'jetpack_pro_bi_yearly',
		productTerm: 'two years',
		currencyCode: 'USD',
		fullPrice: 552,
		discountPrice: 552,
		fullPricePerMonth: 23,
		discountPricePerMonth: 23,
	},
];
const detail = {
	title: 'Jetpack Pro',
	features: [],
	disclaimers: [],
	supportedProducts: [],
	isBundle: true,
	hasPaidPlanForProduct: false,
	pricingForUi: { ...terms[ 0 ], terms },
};
const mockCheckout = jest.fn();
const onClick = checkout => checkout();

beforeEach( () => {
	mockCheckout.mockClear();
	getMyJetpackWindowInitialState.mockReturnValue( { fileSystemWriteAccess: 'yes' } );
	useProduct.mockReturnValue( { detail, isLoading: false } );
	useProductCheckoutWorkflow.mockImplementation( ( { productSlug } ) => ( {
		run: () => mockCheckout( productSlug ),
		hasCheckoutStarted: false,
	} ) );
} );

it( 'keeps the existing bundle install action before Pro rollout', async () => {
	useProduct.mockImplementation( slug => ( {
		detail:
			slug === 'pro'
				? { pricingForUi: { catalogAvailable: false } }
				: { ...detail, title: 'Security', hasPaidPlanForProduct: true },
		isLoading: false,
	} ) );
	const onInstall = jest.fn();
	render( <ProductDetailCard slug="security" onClick={ onInstall } /> );
	await userEvent.click( screen.getByRole( 'button', { name: 'Install Security' } ) );
	expect( onInstall ).toHaveBeenCalledTimes( 1 );
	expect( screen.queryByRole( 'button', { name: 'Manage plan' } ) ).not.toBeInTheDocument();
} );

it( 'keeps the legacy bundle card before pricing arrives or after the request fails', () => {
	useProduct.mockImplementation( slug => ( {
		detail:
			slug === 'pro'
				? { pricingForUi: { catalogAvailable: false } }
				: { ...detail, title: 'Security', pricingForUi: undefined },
		isLoading: false,
	} ) );
	render( <ProductDetailCard slug="security" isUpsell /> );
	expect( screen.getByRole( 'button', { name: 'Get Security' } ) ).toBeEnabled();
} );

it( 'preserves the filesystem restriction before Pro rollout', () => {
	getMyJetpackWindowInitialState.mockReturnValue( { fileSystemWriteAccess: 'no' } );
	useProduct.mockImplementation( slug => ( {
		detail:
			slug === 'pro'
				? { pricingForUi: { catalogAvailable: false } }
				: { ...detail, title: 'Security', status: 'plugin_absent' },
		isLoading: false,
	} ) );
	render( <ProductDetailCard slug="security" /> );
	expect( screen.getByRole( 'button', { name: 'Get Security' } ) ).toBeDisabled();
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Due to your server settings' );
} );

it( 'checks out the selected two-year term and shows its actual billed total', async () => {
	render( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	const user = userEvent.setup();
	await user.click( screen.getByRole( 'combobox', { name: 'Billing term' } ) );
	await user.click( await screen.findByRole( 'option', { name: 'Every two years' } ) );
	expect( screen.getByText( '$552.00 billed per term' ) ).toBeInTheDocument();
	expect( screen.getByText( '/month, paid every two years' ) ).toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Get Jetpack Pro' } ) );
	expect( mockCheckout ).toHaveBeenCalledWith( 'jetpack_pro_bi_yearly' );
} );

it( 'renders the bundle upsell with the AI product icon', () => {
	useProduct.mockReturnValue( {
		detail: { ...detail, supportedProducts: [ 'backup', 'jetpack-ai' ] },
		isLoading: false,
	} );
	render( <ProductDetailCard slug="pro" onClick={ onClick } isUpsell /> );
	expect( getIconBySlug ).toHaveBeenCalledWith( 'ai' );
	expect( screen.getByRole( 'button', { name: 'Get Jetpack Pro' } ) ).toBeEnabled();
} );

it( 'withdraws a selected term after a remote rollback', async () => {
	const { rerender } = render( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	const user = userEvent.setup();
	await user.click( screen.getByRole( 'combobox', { name: 'Billing term' } ) );
	await user.click( await screen.findByRole( 'option', { name: 'Every two years' } ) );
	useProduct.mockReturnValue( {
		detail: {
			...detail,
			pricingForUi: { ...terms[ 0 ], terms: [ terms[ 0 ], { ...terms[ 1 ], available: false } ] },
		},
		isLoading: false,
	} );
	rerender( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	expect( screen.getByRole( 'combobox', { name: 'Billing term' } ) ).toHaveTextContent( 'Yearly' );
	await user.click( screen.getByRole( 'button', { name: 'Get Jetpack Pro' } ) );
	expect( mockCheckout ).toHaveBeenCalledWith( 'jetpack_pro_yearly' );
} );

it.each( [
	[ false, false ],
	[ true, false ],
	[ false, true ],
	[ true, true ],
] )(
	'blocks unavailable sales (upsell: %s, requires support: %s)',
	( isUpsell, requiresSupport ) => {
		useProduct.mockReturnValue( {
			detail: {
				...detail,
				pricingForUi: {
					...terms[ 0 ],
					available: false,
					requiresSupport,
					terms: terms.map( term => ( { ...term, available: false } ) ),
				},
			},
			isLoading: false,
		} );
		render( <ProductDetailCard slug="pro" onClick={ onClick } isUpsell={ isUpsell } /> );
		const button = screen.queryByRole( 'button', { name: 'Get Jetpack Pro' } );
		expect( Boolean( button ) ).toBe( ! isUpsell );
		expect( button?.disabled ?? true ).toBe( true );
		expect(
			screen.queryByRole( 'link', { name: 'Contact support' } )?.getAttribute( 'href' )
		).toBe( isUpsell ? undefined : 'https://jetpack.com/redirect/?source=jetpack-contact-support' );
		expect( screen.queryAllByRole( 'status' ) ).toHaveLength( isUpsell ? 0 : 1 );
		expect(
			screen.queryAllByText(
				requiresSupport
					? 'This plan change requires assistance from our support team.'
					: 'This plan is currently unavailable for purchase.'
			)
		).toHaveLength( isUpsell ? 0 : 1 );
	}
);

it( 'preserves annual legacy bundle checkout without the new term controls', async () => {
	useProduct.mockReturnValue( {
		detail: {
			...detail,
			title: 'Security',
			pricingForUi: { ...terms[ 0 ], wpcomProductSlug: 'jetpack_security_t1_yearly' },
		},
		isLoading: false,
	} );
	render( <ProductDetailCard slug="security" onClick={ onClick } /> );
	expect( screen.queryByLabelText( 'Billing term' ) ).not.toBeInTheDocument();
	expect( screen.queryByText( /billed per term/ ) ).not.toBeInTheDocument();
	await userEvent.click( screen.getByRole( 'button', { name: 'Get Security' } ) );
	expect( mockCheckout ).toHaveBeenCalledWith( 'jetpack_security_t1_yearly' );
} );

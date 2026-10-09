import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useProduct from '../../../data/products/use-product';
import ProductDetailCard from '../index';

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-redirect-to-referrer', () => ( {
	useRedirectToReferrer: () => null,
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { fileSystemWriteAccess: 'yes' } ),
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
	getIconBySlug: () => () => null,
} ) );
jest.mock( '@wordpress/ui', () => ( {
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
	useProduct.mockReturnValue( { detail, isLoading: false } );
	useProductCheckoutWorkflow.mockImplementation( ( { productSlug } ) => ( {
		run: () => mockCheckout( productSlug ),
		hasCheckoutStarted: false,
	} ) );
} );

it( 'checks out the selected two-year term and shows its actual billed total', async () => {
	render( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	const user = userEvent.setup();
	await user.selectOptions( screen.getByLabelText( 'Billing term' ), 'jetpack_pro_bi_yearly' );
	expect( screen.getByText( '$552.00 billed per term' ) ).toBeInTheDocument();
	expect( screen.getByText( '/month, paid every two years' ) ).toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Get Jetpack Pro' } ) );
	expect( mockCheckout ).toHaveBeenCalledWith( 'jetpack_pro_bi_yearly' );
} );

it( 'withdraws a selected term after a remote rollback', async () => {
	const { rerender } = render( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	const user = userEvent.setup();
	await user.selectOptions( screen.getByLabelText( 'Billing term' ), 'jetpack_pro_bi_yearly' );
	useProduct.mockReturnValue( {
		detail: {
			...detail,
			pricingForUi: { ...terms[ 0 ], terms: [ terms[ 0 ], { ...terms[ 1 ], available: false } ] },
		},
		isLoading: false,
	} );
	rerender( <ProductDetailCard slug="pro" onClick={ onClick } /> );
	expect( screen.getByLabelText( 'Billing term' ) ).toHaveValue( 'jetpack_pro_yearly' );
	await user.click( screen.getByRole( 'button', { name: 'Get Jetpack Pro' } ) );
	expect( mockCheckout ).toHaveBeenCalledWith( 'jetpack_pro_yearly' );
} );

it.each( [ false, true ] )( 'blocks unavailable sales (upsell: %s)', isUpsell => {
	useProduct.mockReturnValue( {
		detail: {
			...detail,
			pricingForUi: {
				...terms[ 0 ],
				available: false,
				terms: terms.map( term => ( { ...term, available: false } ) ),
			},
		},
		isLoading: false,
	} );
	render( <ProductDetailCard slug="pro" onClick={ onClick } isUpsell={ isUpsell } /> );
	const button = screen.queryByRole( 'button', { name: 'Get Jetpack Pro' } );
	expect( Boolean( button ) ).toBe( ! isUpsell );
	expect( button?.disabled ?? true ).toBe( true );
	expect( screen.queryByRole( 'link', { name: 'Contact support' } )?.getAttribute( 'href' ) ).toBe(
		isUpsell ? undefined : 'https://jetpack.com/contact-support/'
	);
} );

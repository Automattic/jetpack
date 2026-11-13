import { render, screen } from '@testing-library/react';
import useProduct from '../../../data/products/use-product';
import ProtectProductPage from '../protect/product-page';

jest.mock( '../../../data/products/use-product' );
jest.mock( '../../../data/use-simple-query', () => () => ( { data: {}, isLoading: false } ) );
jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-go-back', () => ( { useGoBack: () => ( {} ) } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {} ) );
jest.mock( '../../go-back-link', () => () => null );
jest.mock( 'react-router', () => ( { generatePath: path => path, useNavigate: () => jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getMyJetpackUrl: path => `https://example.org/wp-admin/admin.php?page=my-jetpack${ path }`,
} ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div>{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	getRedirectUrl: slug => `https://jetpack.com/redirect/?source=${ slug }`,
} ) );

it( 'names no bundle in the upsell until pricing has loaded', () => {
	let isLoading = true;
	useProduct.mockImplementation( slug => ( {
		detail:
			slug === 'security' && ! isLoading
				? {
						pricingForUi: { available: false },
						purchaseReplacement: { slug: 'pro', title: 'Jetpack Pro' },
					}
				: undefined,
		isLoading,
	} ) );
	const { rerender } = render( <ProtectProductPage /> );
	expect( screen.queryByText( /Jetpack Security/ ) ).not.toBeInTheDocument();
	expect( screen.queryByText( /Jetpack Pro/ ) ).not.toBeInTheDocument();
	isLoading = false;
	rerender( <ProtectProductPage /> );
	expect( screen.getByText( 'Learn more about Jetpack Pro' ) ).toBeInTheDocument();
	expect( screen.queryByText( /Jetpack Security/ ) ).not.toBeInTheDocument();
} );

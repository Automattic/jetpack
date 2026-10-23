import { render, screen } from '@testing-library/react';
import ProductPrice from '../index.tsx';

describe( 'ProductPrice', () => {
	const testProps = {
		currency: 'USD',
	};

	it( 'renders zero-priced plans without a NaN discount', () => {
		const { container } = render(
			<ProductPrice { ...testProps } price={ 0 } offPrice={ 0 } variant="simple" />
		);

		expect( container ).toHaveTextContent( '$0' );
		expect( container ).not.toHaveTextContent( 'NaN' );
		expect( container ).not.toHaveTextContent( '% off' );
	} );

	describe( 'When not hiding the price fraction', () => {
		describe( 'And the fraction is zero', () => {
			it( 'does not render the price fraction', () => {
				render( <ProductPrice { ...testProps } hidePriceFraction={ true } price={ 17.0 } /> );

				expect( screen.queryByTestId( 'PriceFraction' ) ).not.toBeInTheDocument();
			} );
		} );

		describe( 'And the fraction is not zero', () => {
			it( 'renders the price fraction', () => {
				render( <ProductPrice { ...testProps } hidePriceFraction={ false } price={ 17.1 } /> );

				expect( screen.getByTestId( 'PriceFraction' ) ).toBeInTheDocument();
			} );
		} );
	} );
} );

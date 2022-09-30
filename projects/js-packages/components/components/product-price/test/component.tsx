import { render, screen } from '@testing-library/react';
import ProductPrice from '../index';

describe( 'ProductPrice', () => {
	const testProps = {
		currency: 'USD',
	};

	describe( 'When hiding the price fraction', () => {
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

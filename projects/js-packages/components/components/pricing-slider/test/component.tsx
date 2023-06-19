import { render, screen } from '@testing-library/react';
import PricingSlider from '../index';

describe( 'PricingSlider', () => {
	it( 'renders the pricing slider', () => {
		render( <PricingSlider /> );
		expect( screen.getByTestId( 'pricing-slider' ) ).toBeInTheDocument();
	} );
} );

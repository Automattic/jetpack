import { render, screen } from '@testing-library/react';
import ResizeObserver from 'resize-observer-polyfill';
import PricingSlider from '../index';

describe( 'PricingSlider', () => {
	beforeAll( () => {
		global.ResizeObserver = ResizeObserver;
	} );

	it( 'renders the pricing slider', () => {
		render( <PricingSlider /> );
		expect( screen.getByTestId( 'pricing-slider' ) ).toBeInTheDocument();
	} );
} );

import { render, screen } from '@testing-library/react';
import ResizeObserver from 'resize-observer-polyfill';
import NumberSlider from '../index';

describe( 'NumberSlider', () => {
	beforeAll( () => {
		global.ResizeObserver = ResizeObserver;
	} );

	it( 'renders the number slider', () => {
		render( <NumberSlider /> );
		expect( screen.getByTestId( 'number-slider' ) ).toBeInTheDocument();
	} );
} );

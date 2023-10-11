import { render, screen } from '@testing-library/react';
import StatCard from '../index';

describe( 'StatCard', () => {
	const testProps = {
		icon: <div></div>,
		label: 'Label',
		value: 1806,
	};

	describe( 'when using the square variant', () => {
		it( 'renders the compact value', () => {
			render( <StatCard { ...testProps } variant="square" /> );
			expect( screen.getByText( '1.8K' ) ).toBeInTheDocument();

			// @todo Remove this once WordPress 6.4 is the minimum.
			expect( console ).toHaveWarned(
				'`position` prop in wp.components.tooltip is deprecated since version 6.4. Please use `placement` prop instead.'
			);
		} );
	} );

	describe( 'when using the horizontal variant', () => {
		it( 'renders the full value', () => {
			render( <StatCard { ...testProps } variant="horizontal" /> );
			expect( screen.getByText( '1,806' ) ).toBeInTheDocument();
		} );
	} );
} );

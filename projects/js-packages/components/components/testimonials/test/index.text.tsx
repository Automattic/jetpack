import { render, screen } from '@testing-library/react';
import Testimonial from '../index';

describe( 'Testimonial', () => {
	it( 'should render the testimonial', () => {
		const quote = 'This is a quote';
		const author = 'John Doe';
		const profession = 'CEO';
		const img = 'https://via.placeholder.com/150';

		render(
			<Testimonial quote={ quote } author={ author } profession={ profession } img={ img } />
		);

		expect( screen.getByText( `“${ quote }”` ) ).toBeInTheDocument();
		expect( screen.getByText( author ) ).toBeInTheDocument();
		expect( screen.getByText( profession ) ).toBeInTheDocument();
		expect( screen.getByAltText( author ) ).toBeInTheDocument();
	} );
} );

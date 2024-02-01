import { render, screen } from '@testing-library/react';
import AutomatticBylineLogo from '../index';

describe( 'AutomatticBylineLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the AutomatticBylineLogo component', () => {
		it( 'validate the class name', () => {
			const { container } = render( <AutomatticBylineLogo { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );

		it( 'renders the default title', () => {
			render( <AutomatticBylineLogo /> );

			expect( screen.getByText( 'An Automattic Airline' ) ).toBeInTheDocument();
		} );

		it( 'renders the given title', () => {
			render( <AutomatticBylineLogo title="An A8C Airline" /> );

			expect( screen.getByText( 'An A8C Airline' ) ).toBeInTheDocument();
		} );
	} );
} );

import { render, screen } from '@testing-library/react';
import JetpackFooter from '../index';

describe( 'JetpackFooter', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackFooter component', () => {
		it( 'validate the class name', () => {
			const { container } = render( <JetpackFooter { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );

		it( 'validates Jetpack logo', () => {
			render( <JetpackFooter /> );

			expect( screen.getByLabelText( 'Jetpack logo' ) ).toBeInTheDocument();
		} );

		it( 'tests for module name and link', () => {
			render(
				<JetpackFooter
					moduleName="Test module"
					moduleNameHref="https://jetpack.com/path/to-some-page"
				/>
			);

			const element = screen.getByLabelText( 'Test module' );

			expect( element ).toBeInTheDocument();
			expect( element ).toBeInstanceOf( HTMLAnchorElement );
			expect( element ).toHaveAttribute( 'href', 'https://jetpack.com/path/to-some-page' );
		} );

		it( 'validates the a8c label', () => {
			render( <JetpackFooter /> );

			for ( const element of screen.getAllByLabelText( 'An Automattic Airline' ) ) {
				expect( element ).toBeInTheDocument();
			}
		} );
	} );
} );

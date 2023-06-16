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

			expect( screen.getByLabelText( 'Jetpack' ) ).toBeInTheDocument();
		} );

		it( 'tests for module name and link', () => {
			render(
				<JetpackFooter
					moduleName="Test module"
					moduleNameHref="https://jetpack.com/path/to-some-page"
				/>
			);

			const element = screen.getByText( 'Test module' );

			expect( element ).toBeInTheDocument();
			expect( element ).toBeInstanceOf( HTMLAnchorElement );
			expect( element ).toHaveAttribute( 'href', 'https://jetpack.com/path/to-some-page' );
		} );

		it( 'validates the a8c label', () => {
			render( <JetpackFooter /> );

			expect(
				screen.getByLabelText( 'An Automattic Airline', { selector: 'a' } )
			).toBeInTheDocument();
		} );
	} );
} );

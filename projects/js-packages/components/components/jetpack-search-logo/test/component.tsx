import { render, screen } from '@testing-library/react';
import JetpackSearchLogo from '../index';

describe( 'JetpackSearchLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackSearchLogo component', () => {
		it( 'validate the class name', () => {
			render( <JetpackSearchLogo { ...testProps } /> );

			expect( screen.getByLabelText( 'Jetpack Search Logo' ) ).toHaveClass( testProps.className );
		} );
	} );
} );

import { render, screen } from '@testing-library/react';
import JetpackLogo from '../index';
import '@testing-library/jest-dom';

describe( 'JetpackLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackLogo component', () => {
		it( 'validate the class name', () => {
			render( <JetpackLogo { ...testProps } /> );

			expect( screen.getByLabelText( 'Jetpack Logo' ) ).toHaveClass( testProps.className );
		} );
	} );
} );

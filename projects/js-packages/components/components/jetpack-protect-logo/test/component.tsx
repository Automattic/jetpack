import { render, screen } from '@testing-library/react';
import JetpackProtectLogo from '../index.js';

describe( 'JetpackProtectLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackProtectLogo component', () => {
		it( 'validate the class name', () => {
			render( <JetpackProtectLogo { ...testProps } /> );

			expect( screen.getByLabelText( 'Jetpack Protect Logo' ) ).toHaveClass( testProps.className );
		} );
	} );
} );

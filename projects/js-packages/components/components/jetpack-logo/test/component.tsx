import { render, screen } from '@testing-library/react';
import React from 'react';
import JetpackLogo from '../index';

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

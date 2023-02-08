import { render, screen } from '@testing-library/react';
import JetpackVideoPressLogo from '../index';

describe( 'JetpackVideoPressLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackVideoPressLogo component', () => {
		it( 'validate the class name', () => {
			render( <JetpackVideoPressLogo { ...testProps } /> );

			expect( screen.getByLabelText( 'VideoPress Logo' ) ).toHaveClass( testProps.className );
		} );
	} );
} );

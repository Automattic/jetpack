import { render, screen } from '@testing-library/react';
import React from 'react';
import ActionButton from '../index';
import '@testing-library/jest-dom';

describe( 'ActionButton', () => {
	const testProps = {
		label: 'Action!',
	};

	describe( 'Render the ActionButton component', () => {
		render( <ActionButton { ...testProps } /> );

		it( 'renders the register button', () => {
			expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Action!' );
		} );
	} );
} );

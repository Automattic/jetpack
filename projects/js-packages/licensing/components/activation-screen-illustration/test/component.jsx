import { render, screen } from '@testing-library/react';
import React from 'react';
import ActivationScreenIllustration from '../index';

describe( 'ActivationScreenIllustration', () => {
	describe( 'Render the ActivationScreenIllustration component with support link', () => {
		const testProps = {
			imageUrl: 'sucess.png',
			showSupportLink: true,
		};

		it( 'correct images src is used', () => {
			render( <ActivationScreenIllustration { ...testProps } /> );
			const image = screen.getByRole( 'img' );
			expect( image ).toHaveAttribute( 'src', testProps.imageUrl );
		} );

		it( 'support link rendered', () => {
			render( <ActivationScreenIllustration { ...testProps } /> );
			expect( screen.getByRole( 'link', { name: 'Contact us.' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Render the ActivationScreenIllustration component without support link', () => {
		const testProps = {
			imageUrl: 'sucess.png',
			showSupportLink: false,
		};

		it( 'support link not rendered', () => {
			render( <ActivationScreenIllustration { ...testProps } /> );
			expect( screen.queryByRole( 'link', { name: 'Contact us.' } ) ).not.toBeInTheDocument();
		} );
	} );
} );

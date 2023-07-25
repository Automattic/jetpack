import { render, screen } from '@testing-library/react';
import React from 'react';
import OnboardingWizard from '../index';

describe( 'OnboardingWizard', () => {
	test( 'Renders the component', () => {
		render( <OnboardingWizard /> );

		expect( screen.getByRole( 'heading', { name: 'Entrepreneur Plan' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Buy now' } ) ).toBeInTheDocument();
	} );
} );

import { render, screen } from '@testing-library/react';
import React from 'react';
import { AutomationsAdmin } from '../index';

describe( 'AutomationsAdmin', () => {
	test( 'Renders the component', () => {
		render( <AutomationsAdmin /> );

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );
} );

import { render, screen } from '@testing-library/react';
import React from 'react';
import { AutomationsAdminContainer } from '../index';

describe( 'AutomationsAdminContainer', () => {
	test( 'Renders the component', () => {
		render( <AutomationsAdminContainer /> );

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );
} );

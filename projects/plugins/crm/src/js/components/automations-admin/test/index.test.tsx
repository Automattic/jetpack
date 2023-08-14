import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AutomationsAdmin } from '../index';

describe( 'AutomationsAdmin', () => {
	test( 'Render the main page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/automations' ] }>
				<AutomationsAdmin />
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );

	test( 'Render the add page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/automations/add' ] }>
				<AutomationsAdmin />
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Add Automation' } ) ).toBeInTheDocument();
	} );

	test( 'Render the edit page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/automations/edit' ] }>
				<AutomationsAdmin />
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Edit Automation' } ) ).toBeInTheDocument();
	} );

	test( 'Fallback to main page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/some-path' ] }>
				<AutomationsAdmin />
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );
} );

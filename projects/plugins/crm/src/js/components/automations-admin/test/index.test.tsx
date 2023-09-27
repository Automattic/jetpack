import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AutomationsAdmin } from '../index';

describe( 'AutomationsAdmin', () => {
	const queryClient = new QueryClient();

	test( 'Render the main page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/automations' ] }>
				<QueryClientProvider client={ queryClient }>
					<AutomationsAdmin />
				</QueryClientProvider>
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );

	test( 'Fallback to main page', () => {
		render(
			<MemoryRouter initialEntries={ [ '/some-path' ] }>
				<QueryClientProvider client={ queryClient }>
					<AutomationsAdmin />
				</QueryClientProvider>
			</MemoryRouter>
		);

		expect( screen.getByRole( 'heading', { name: 'Automations' } ) ).toBeInTheDocument();
	} );
} );

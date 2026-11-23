import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import StripeCard from '../stripe-card';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

const renderCard = ( status: Record< string, unknown > ) => {
	( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) =>
		Promise.resolve(
			path === 'memberships/status'
				? { is_connected: true, connected_account_description: 'Acme', ...status }
				: {}
		)
	);
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<StripeCard />
		</QueryClientProvider>
	);
};

describe( 'StripeCard', () => {
	it.each( [
		[ 'can’t accept charges', { connected_account_accepts_charges: false }, true ],
		[ 'accepts charges', { connected_account_accepts_charges: true }, false ],
		[ 'doesn’t report charges', {}, false ],
	] )( 'warns when the account %s: %p', async ( _case, status, warned ) => {
		renderCard( status );

		await expect( screen.findByText( 'Connected to Acme.' ) ).resolves.toBeVisible();
		expect( Boolean( screen.queryByText( /can’t accept payments/ ) ) ).toBe( warned );
	} );
} );

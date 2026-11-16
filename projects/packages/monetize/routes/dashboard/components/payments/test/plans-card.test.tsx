import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import PlansCard from '../plans-card';
import { getPaymentsState } from '../state';

jest.mock( '../state', () => ( { getPaymentsState: jest.fn() } ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/free-tier', () => ( { useFreeTier: () => ( { data: undefined } ) } ) );

const renderCard = ( product: Record< string, unknown >, canManagePlans = true ) => {
	( getPaymentsState as jest.Mock ).mockReturnValue( { canManagePlans } );
	( wpcomFetch as jest.Mock ).mockResolvedValue( {
		products: [ { id: 1, title: 'Gold', price: 5, currency: 'USD', ...product } ],
	} );
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<PlansCard />
		</QueryClientProvider>
	);
};

describe( 'PlansCard', () => {
	it.each( [
		[ 'a plan the site can manage', true, false, true ],
		[ 'a plan on a site that can’t manage plans', false, false, false ],
		[ 'a read-only plan', true, true, false ],
	] )( 'offers Delete for %s: %p', async ( _case, canManagePlans, isReadOnly, offered ) => {
		renderCard( { type: 'donation', is_read_only: isReadOnly }, canManagePlans );

		await expect( screen.findByRole( 'heading', { name: 'Gold' } ) ).resolves.toBeVisible();
		expect( Boolean( screen.queryByRole( 'button', { name: 'Delete' } ) ) ).toBe( offered );
	} );

	it( 'shows a tier’s description as WordPress.com rendered it', async () => {
		renderCard( {
			type: 'tier',
			description: 'Hi **you**',
			description_rendered: '<p>Hi <strong>you</strong></p>',
		} );

		await expect( screen.findByText( 'you', { selector: 'strong' } ) ).resolves.toBeVisible();
		expect( screen.queryByText( /\*\*/ ) ).not.toBeInTheDocument();
	} );
} );

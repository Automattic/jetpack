import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import DeletePlanDialog from '../delete-plan-dialog';
import type { MembershipProduct } from '../../../data/memberships';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

const product = ( id: number ) => ( { id, title: 'Gold' } ) as MembershipProduct;

describe( 'DeletePlanDialog', () => {
	it( 'deletes a tier’s monthly and annual products, cancelling subscriptions when asked', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( {} );
		const onClose = jest.fn();
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<DeletePlanDialog
					plan={ { product: product( 1 ), annual: product( 2 ) } }
					onClose={ onClose }
				/>
			</QueryClientProvider>
		);

		await userEvent.click(
			screen.getByRole( 'checkbox', { name: 'Cancel existing subscriptions' } )
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( ( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request ) ).toEqual(
			[ 1, 2 ].map( id => ( {
				api: 'wpcom/v2',
				path: `memberships/product/${ id }`,
				method: 'DELETE',
				data: { cancel_subscriptions: true },
			} ) )
		);
	} );
} );

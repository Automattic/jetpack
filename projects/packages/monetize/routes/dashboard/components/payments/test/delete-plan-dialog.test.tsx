import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import DeletePlanDialog from '../delete-plan-dialog';
import type { MembershipProduct } from '../../../data/memberships';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

const product = ( id: number ) => ( { id, title: 'Gold' } ) as MembershipProduct;

const renderDialog = ( onClose: () => void ) =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<DeletePlanDialog
				plan={ { product: product( 1 ), annual: product( 2 ) } }
				onClose={ onClose }
			/>
		</QueryClientProvider>
	);

const requestedPaths = () =>
	( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request.path );

describe( 'DeletePlanDialog', () => {
	beforeEach( () => ( wpcomFetch as jest.Mock ).mockReset() );

	it( 'deletes a tier’s monthly and annual products, cancelling subscriptions when asked', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( {} );
		const onClose = jest.fn();
		renderDialog( onClose );

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

	it( 'retries only the product that failed to delete', async () => {
		( wpcomFetch as jest.Mock )
			.mockResolvedValueOnce( {} )
			.mockRejectedValueOnce( new Error( 'Stripe is down.' ) )
			.mockResolvedValueOnce( {} );
		const onClose = jest.fn();
		renderDialog( onClose );

		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );
		await expect( screen.findAllByText( 'Stripe is down.' ) ).resolves.not.toHaveLength( 0 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( requestedPaths() ).toEqual( [
			'memberships/product/1',
			'memberships/product/2',
			'memberships/product/2',
		] );
	} );
} );

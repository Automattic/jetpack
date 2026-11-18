import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Subscribers from '..';
import { wpcomFetch } from '../../../data/wpcom-fetch';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackSubscribersEvent: jest.fn() } ) );

const ownership = ( id: number, email: string ) => ( {
	id,
	user: { ID: id * 10, name: '', user_email: email },
	plan: { title: 'Gold', renewal_price: 5, currency: 'USD', renew_interval: '1 month' },
	start_date: '2026-03-03 12:00:00',
	all_time_total: 15,
} );

const renderTab = () =>
	render(
		<QueryClientProvider
			client={ new QueryClient( { defaultOptions: { queries: { retry: false } } } ) }
		>
			<Subscribers />
		</QueryClientProvider>
	);

const cancelRow = async () => {
	await userEvent.click(
		await screen.findByRole( 'button', { name: 'Cancel payment from b@example.com' } )
	);
	await userEvent.click(
		within( screen.getByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Cancel payment' } )
	);
};

describe( 'Subscribers', () => {
	beforeEach( () => ( wpcomFetch as jest.Mock ).mockReset() );

	it( 'cancels a subscription, then loads more from the offset the cancellation leaves', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { path, query } ) => {
			if ( path !== 'memberships/subscribers' ) {
				return Promise.resolve( { success: true } );
			}
			return Promise.resolve(
				query.offset === 0
					? {
							total: 3,
							ownerships: [ ownership( 1, 'a@example.com' ), ownership( 2, 'b@example.com' ) ],
						}
					: { total: 2, ownerships: [ ownership( 3, 'c@example.com' ) ] }
			);
		} );
		renderTab();

		await cancelRow();

		await waitFor( () =>
			expect( screen.queryByRole( 'heading', { name: 'b@example.com' } ) ).not.toBeInTheDocument()
		);
		expect( wpcomFetch ).toHaveBeenCalledWith( {
			api: 'wpcom/v2',
			path: 'memberships/subscriptions/2/cancel',
			method: 'POST',
			data: { user_id: 20 },
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'Load more' } ) );

		await expect(
			screen.findByRole( 'heading', { name: 'c@example.com' } )
		).resolves.toBeVisible();
		expect( wpcomFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { query: { offset: 1 } } )
		);
		expect( screen.queryByRole( 'button', { name: 'Load more' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the subscription with WordPress.com’s message when cancelling fails', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) =>
			path === 'memberships/subscribers'
				? Promise.resolve( { total: 1, ownerships: [ ownership( 2, 'b@example.com' ) ] } )
				: Promise.reject( new Error( 'Failed to cancel subscription' ) )
		);
		renderTab();

		await cancelRow();

		await expect(
			screen.findAllByText( 'Failed to cancel subscription' )
		).resolves.not.toHaveLength( 0 );
		expect(
			screen.getByRole( 'heading', { name: 'b@example.com', hidden: true } )
		).toBeInTheDocument();
	} );

	it( 'shows a subscription once when a new one shifts the next page onto it', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { query } ) =>
			Promise.resolve(
				query.offset === 0
					? {
							total: 3,
							ownerships: [ ownership( 3, 'c@example.com' ), ownership( 2, 'b@example.com' ) ],
						}
					: {
							total: 4,
							ownerships: [ ownership( 2, 'b@example.com' ), ownership( 1, 'a@example.com' ) ],
						}
			)
		);
		renderTab();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Load more' } ) );

		await expect(
			screen.findByRole( 'heading', { name: 'a@example.com' } )
		).resolves.toBeVisible();
		expect( screen.getAllByRole( 'heading', { name: 'b@example.com' } ) ).toHaveLength( 1 );
	} );
} );

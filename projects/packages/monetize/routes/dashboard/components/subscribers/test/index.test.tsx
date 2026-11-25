import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Subscribers from '..';
import { wpcomFetch } from '../../../data/wpcom-fetch';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackSubscribersEvent: jest.fn() } ) );

const ownership = ( id: number, email: string, name = '' ) => ( {
	id,
	user: { ID: id * 10, name, user_email: email },
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

const chooseRowAction = async ( email: string, action: RegExp ) => {
	await expect( screen.findByText( email ) ).resolves.toBeVisible();
	const row = screen.getByRole( 'row', { name: new RegExp( email ) } );
	await userEvent.click( within( row ).getByRole( 'button', { name: 'Actions' } ) );
	await userEvent.click( await screen.findByRole( 'menuitem', { name: action } ) );
};

const cancelRow = async ( email: string ) => {
	await chooseRowAction( email, /Cancel payment/ );
	await userEvent.click(
		within( screen.getByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Cancel payment' } )
	);
};

describe( 'Subscribers', () => {
	beforeEach( () => ( wpcomFetch as jest.Mock ).mockReset() );

	it( 'shows names as text, not as the HTML entities WordPress.com sends', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( {
			total: 1,
			ownerships: [ ownership( 1, 'a@example.com', 'Tom &amp; Jerry' ) ],
		} );
		renderTab();

		await expect( screen.findByText( 'Tom & Jerry' ) ).resolves.toBeVisible();
	} );

	it( 'cancels a subscription, then refetches the page to fill the gap', async () => {
		let cancelled = false;
		( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) => {
			if ( path !== 'memberships/subscribers' ) {
				cancelled = true;
				return Promise.resolve( { success: true } );
			}
			return Promise.resolve(
				cancelled
					? {
							total: 2,
							ownerships: [ ownership( 1, 'a@example.com' ), ownership( 3, 'c@example.com' ) ],
						}
					: {
							total: 3,
							ownerships: [ ownership( 2, 'b@example.com' ), ownership( 1, 'a@example.com' ) ],
						}
			);
		} );
		renderTab();

		await cancelRow( 'b@example.com' );

		await expect( screen.findByText( 'c@example.com' ) ).resolves.toBeVisible();
		expect( screen.queryByText( 'b@example.com' ) ).not.toBeInTheDocument();
		expect( wpcomFetch ).toHaveBeenCalledWith( {
			api: 'wpcom/v2',
			path: 'memberships/subscriptions/2/cancel',
			method: 'POST',
			data: { user_id: 20 },
		} );
	} );

	it( 'keeps the subscription with WordPress.com’s message when cancelling fails', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) =>
			path === 'memberships/subscribers'
				? Promise.resolve( { total: 1, ownerships: [ ownership( 2, 'b@example.com' ) ] } )
				: Promise.reject( new Error( 'Failed to cancel subscription' ) )
		);
		renderTab();

		await cancelRow( 'b@example.com' );

		await expect(
			screen.findAllByText( 'Failed to cancel subscription' )
		).resolves.not.toHaveLength( 0 );
		expect( screen.getByText( 'b@example.com' ) ).toBeInTheDocument();
	} );

	it( 'asks WordPress.com for the next 50 on the next page', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { query } ) =>
			Promise.resolve(
				query.offset === 0
					? { total: 51, ownerships: [ ownership( 2, 'b@example.com' ) ] }
					: { total: 51, ownerships: [ ownership( 1, 'a@example.com' ) ] }
			)
		);
		renderTab();

		await expect( screen.findByText( 'b@example.com' ) ).resolves.toBeVisible();
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );

		await expect( screen.findByText( 'a@example.com' ) ).resolves.toBeVisible();
		expect( wpcomFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { query: { offset: 50 } } )
		);
	} );

	it( 'clears the last page’s rows when the next page fails, then loads it on trying again', async () => {
		let failNext = true;
		( wpcomFetch as jest.Mock ).mockImplementation( ( { query } ) => {
			if ( query.offset === 0 ) {
				return Promise.resolve( { total: 51, ownerships: [ ownership( 2, 'b@example.com' ) ] } );
			}
			if ( failNext ) {
				failNext = false;
				return Promise.reject( new Error( 'Page failed' ) );
			}
			return Promise.resolve( { total: 51, ownerships: [ ownership( 1, 'a@example.com' ) ] } );
		} );
		renderTab();

		await expect( screen.findByText( 'b@example.com' ) ).resolves.toBeVisible();
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect( screen.findByText( 'Page failed' ) ).resolves.toBeVisible();
		expect( screen.queryByText( 'b@example.com' ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		await expect( screen.findByText( 'a@example.com' ) ).resolves.toBeVisible();
	} );

	it( 'closes the details once their subscription is cancelled from them', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) =>
			Promise.resolve(
				path === 'memberships/subscribers'
					? { total: 1, ownerships: [ ownership( 2, 'b@example.com' ) ] }
					: { success: true }
			)
		);
		renderTab();

		await chooseRowAction( 'b@example.com', /View/ );
		await userEvent.click(
			within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Cancel payment' } )
		);
		await userEvent.click(
			within( screen.getByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Cancel payment' } )
		);

		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'loads the list when trying again after it failed', async () => {
		( wpcomFetch as jest.Mock )
			.mockRejectedValueOnce( new Error( 'Something went wrong' ) )
			.mockResolvedValue( { total: 1, ownerships: [ ownership( 2, 'b@example.com' ) ] } );
		renderTab();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Try again' } ) );

		await expect( screen.findByText( 'b@example.com' ) ).resolves.toBeVisible();
	} );

	it( 'shows only the empty message, without the table’s controls, when nobody has paid yet', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( { total: 0, ownerships: [] } );
		renderTab();

		await expect(
			screen.findByText( /You don’t have any paid subscribers yet/ )
		).resolves.toBeVisible();
		expect( screen.queryByRole( 'button', { name: 'View options' } ) ).not.toBeInTheDocument();
	} );
} );

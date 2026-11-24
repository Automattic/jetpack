import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import ReturnNotice, { readStripeReturn, withoutStripeReturn } from '../return-notice';
import { getPaymentsState } from '../state';

jest.mock( '../state', () => ( { getPaymentsState: jest.fn() } ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

const PAGE = 'https://example.com/wp-admin/admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dpayments';

describe( 'readStripeReturn', () => {
	it.each( [
		[ '&stripe_connect_success=gutenberg', 'connected' ],
		[ '&stripe_connect_cancelled=1', 'cancelled' ],
		[ '', null ],
	] )(
		'reads %s from the URL WordPress.com returns to, and the rest keeps the tab',
		( added, result ) => {
			expect( readStripeReturn( PAGE + added ) ).toBe( result );
			expect( withoutStripeReturn( PAGE + added ) ).toBe( PAGE );
		}
	);
} );

describe( 'ReturnNotice', () => {
	const renderConnected = ( products: unknown[], canManagePlans = true ) => {
		window.history.replaceState( null, '', '?stripe_connect_success=1' );
		( getPaymentsState as jest.Mock ).mockReturnValue( { canManagePlans } );
		( wpcomFetch as jest.Mock ).mockReset().mockResolvedValue( { products } );
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<ReturnNotice />
			</QueryClientProvider>
		);
	};

	it( 'opens the add dialog from a site with no plans yet', async () => {
		const user = userEvent.setup();
		renderConnected( [] );

		await user.click( await screen.findByRole( 'button', { name: 'Add a payment plan' } ) );

		expect( window.location.hash ).toBe( '#add-new-payment-plan' );
	} );

	it.each( [
		[ 'a site with plans', [ { id: 1 } ], true ],
		[ 'a site that can’t manage plans', [], false ],
	] )( 'offers no plan to add for %s', async ( _label, products, canManagePlans ) => {
		renderConnected( products, canManagePlans );

		// Let the plans load, so the button isn't missing only because they haven't yet.
		await act( () => new Promise( resolve => setTimeout( resolve ) ) );

		expect( screen.getByText( 'Congrats! Your site is now connected to Stripe.' ) ).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Add a payment plan' } )
		).not.toBeInTheDocument();
	} );
} );

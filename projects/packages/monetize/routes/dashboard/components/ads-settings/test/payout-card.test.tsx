import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { PayoutCard } from '../payout-card';
import type { Payout } from '../../../data/use-wpcom-ads-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/tracking' );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Render the card once WordPress.com's payout details have loaded.
 *
 * @param stored    - The stored payout details.
 * @param adsActive - Whether ads are on.
 */
async function renderLoaded( stored: Payout, adsActive = true ) {
	mockedApiFetch.mockResolvedValueOnce( stored );
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	render(
		<QueryClientProvider client={ client }>
			<PayoutCard adsActive={ adsActive } />
		</QueryClientProvider>
	);
	await expect(
		screen.findByRole( 'textbox', { name: 'PayPal email address' } )
	).resolves.toBeVisible();
}

describe( 'PayoutCard', () => {
	beforeEach( () => mockedApiFetch.mockReset() );

	it.each( [
		[ 'warns that earnings wait for an address', '', true, true ],
		[ 'says nothing once an address is on file', 'a@example.com', true, false ],
		[ 'says nothing while ads are off', '', false, false ],
	] )( '%s', async ( _name, paypal, adsActive, warns ) => {
		await renderLoaded( { paypal, tosSigned: Boolean( paypal ) }, adsActive );

		expect( Boolean( screen.queryByText( /Add a PayPal address to get paid/ ) ) ).toBe( warns );
	} );

	it( 'saves a first address only with the terms agreed', async () => {
		const user = userEvent.setup();
		await renderLoaded( { paypal: '', tosSigned: false } );
		await user.type( screen.getByRole( 'textbox' ), 'a@example.com' );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );

		mockedApiFetch.mockResolvedValueOnce( { paypal: 'a@example.com', tosSigned: true } );
		await user.click( screen.getByRole( 'checkbox' ) );
		await user.click( save );

		await waitFor( () =>
			expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
				path: '/jetpack/v4/monetize/ads/payout',
				method: 'POST',
				data: { paypal: 'a@example.com', tos: true },
			} )
		);
	} );
} );

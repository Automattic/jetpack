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
 * The WordPress.com response for some payout details.
 *
 * @param payout - The payout details.
 * @return The response body.
 */
function toWpcom( payout: Payout ) {
	return { settings: { paypal: payout.paypal, tos: payout.tosSigned ? 'signed' : '' } };
}

/**
 * Render the card once WordPress.com's payout details have loaded.
 *
 * @param stored    - The stored payout details.
 * @param adsActive - Whether ads are on.
 */
async function renderLoaded( stored: Payout, adsActive = true ) {
	mockedApiFetch.mockResolvedValueOnce( toWpcom( stored ) );
	renderCard( adsActive );
	await waitFor( () =>
		expect( screen.getByRole( 'textbox', { name: 'PayPal email address' } ) ).toBeEnabled()
	);
}

/**
 * Render the card in a fresh query client.
 *
 * @param adsActive - Whether ads are on.
 */
function renderCard( adsActive = true ) {
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	render(
		<QueryClientProvider client={ client }>
			<PayoutCard adsActive={ adsActive } />
		</QueryClientProvider>
	);
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

	it.each( [
		[ 'while loading', () => new Promise( () => {} ), false ],
		[ 'when loading fails', () => Promise.reject( { code: 'rest_cannot_manage' } ), true ],
	] )( 'shows the card with its field disabled %s', async ( _name, respond, failed ) => {
		mockedApiFetch.mockImplementationOnce( respond );
		renderCard();

		expect( screen.getByRole( 'heading', { name: 'Payouts' } ) ).toBeVisible();
		expect( screen.getByRole( 'textbox', { name: 'PayPal email address' } ) ).toBeDisabled();
		await waitFor( () =>
			expect( Boolean( screen.queryByText( 'Your payout details could not be loaded.' ) ) ).toBe(
				failed
			)
		);
	} );

	it( 'saves a first address only with the terms agreed', async () => {
		const user = userEvent.setup();
		await renderLoaded( { paypal: '', tosSigned: false } );
		await user.type( screen.getByRole( 'textbox' ), 'a@example.com' );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );

		mockedApiFetch.mockResolvedValueOnce( toWpcom( { paypal: 'a@example.com', tosSigned: true } ) );
		await user.click( screen.getByRole( 'checkbox' ) );
		await user.click( save );

		await waitFor( () =>
			expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
				path: '/jetpack/v4/monetize/wpcom/v2/wordads/settings',
				method: 'POST',
				data: { paypal: 'a@example.com', tos: 'signed' },
			} )
		);
	} );

	it( 'explains a rejected address', async () => {
		const user = userEvent.setup();
		await renderLoaded( { paypal: 'a@example.com', tosSigned: true } );
		await user.clear( screen.getByRole( 'textbox' ) );
		await user.type( screen.getByRole( 'textbox' ), 'not-an-address' );

		mockedApiFetch.mockRejectedValueOnce( {
			code: 'rest_invalid_param',
			message: 'Invalid parameter(s): paypal',
			data: { status: 400 },
		} );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await expect(
			screen.findByText( 'Enter a valid PayPal email address.' )
		).resolves.toBeVisible();
	} );

	it( 'keeps signed terms checked and locked', async () => {
		await renderLoaded( { paypal: 'a@example.com', tosSigned: true } );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect( screen.getByRole( 'checkbox' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'saves the terms alone when there is no address yet', async () => {
		const user = userEvent.setup();
		await renderLoaded( { paypal: '', tosSigned: false } );

		mockedApiFetch.mockResolvedValueOnce( toWpcom( { paypal: '', tosSigned: true } ) );
		await user.click( screen.getByRole( 'checkbox' ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () =>
			expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
				path: '/jetpack/v4/monetize/wpcom/v2/wordads/settings',
				method: 'POST',
				data: { tos: 'signed' },
			} )
		);
	} );
} );

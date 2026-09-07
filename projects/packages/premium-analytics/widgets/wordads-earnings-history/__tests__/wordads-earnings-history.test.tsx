/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsEarningsHistory from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const EARNINGS = {
	earnings: {
		total_earnings: '120.00',
		total_amount_owed: '30.00',
		wordads: {
			'2026-06': { amount: '90.00', pageviews: 60000, status: 1 },
			'2026-07': { amount: '30.00', pageviews: 20000, status: 0 },
		},
		sponsored: {},
		adjustment: {},
	},
};

const ERROR_DESCRIPTION = "We couldn't load WordAds earnings. Please try again in a moment.";

describe( 'WordAdsEarningsHistory', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( EARNINGS );
	} );

	it( 'renders earnings rows newest-first with formatted currency and status', async () => {
		render( <WordAdsEarningsHistory attributes={ {} } /> );
		await expect( screen.findByText( '07-2026' ) ).resolves.toBeInTheDocument();

		// Read the cells in document order: ordering is produced by the view's sort
		// over the raw period key, and only reading it back pins that composition.
		expect( screen.getAllByText( /^\d{2}-\d{4}$/ ).map( el => el.textContent ) ).toEqual( [
			'07-2026',
			'06-2026',
		] );
		expect( screen.getAllByText( /^\$[\d,]+\.\d{2}$/ ).map( el => el.textContent ) ).toEqual( [
			'$30.00',
			'$90.00',
		] );
		expect( screen.getAllByText( /^[\d,]+$/ ).map( el => el.textContent ) ).toEqual( [
			'20,000',
			'60,000',
		] );
		expect( screen.getByText( 'Unpaid' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Paid' ) ).toBeInTheDocument();
	} );

	it( 'falls back to "?" rather than "Unpaid" when a period omits its status', async () => {
		// `0` is itself "Unpaid", so a missing status must not collapse into it.
		mockApiFetch.mockResolvedValue( {
			earnings: {
				...EARNINGS.earnings,
				wordads: { '2026-07': { amount: '30.00', pageviews: 20000 } },
			},
		} );
		render( <WordAdsEarningsHistory attributes={ {} } /> );

		await expect( screen.findByText( '?' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Unpaid' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the error state when the earnings request fails', async () => {
		// Reject with a non-retryable (403) error so React Query surfaces the
		// failure immediately instead of retrying with backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );
		render( <WordAdsEarningsHistory attributes={ {} } /> );

		await expect( screen.findByText( ERROR_DESCRIPTION ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( '07-2026' ) ).not.toBeInTheDocument();
	} );

	it( 'recovers via Retry after a failed earnings request', async () => {
		// Only the first request fails, so rows can only come from Retry's refetch.
		mockApiFetch.mockRejectedValueOnce( { status: 403, message: 'Forbidden' } );
		render( <WordAdsEarningsHistory attributes={ {} } /> );

		await expect( screen.findByText( ERROR_DESCRIPTION ) ).resolves.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		await expect( screen.findByText( '07-2026' ) ).resolves.toBeInTheDocument();
	} );
} );

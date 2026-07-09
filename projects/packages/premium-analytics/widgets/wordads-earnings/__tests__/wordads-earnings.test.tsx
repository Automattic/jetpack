/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsEarningsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const EARNINGS_RESPONSE = {
	earnings: {
		total_earnings: '128.42',
		total_amount_owed: '42.17',
		wordads: {
			'2026-06': { amount: '42.17', pageviews: '18240', status: 0 },
			'2026-05': { amount: '38.90', pageviews: '16110', status: 1 },
		},
		sponsored: {
			'2026-05': { amount: '12.00', pageviews: '2100', status: 3 },
		},
		adjustment: {},
	},
};

describe( 'WordAdsEarningsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( EARNINGS_RESPONSE );
	} );

	it( 'renders the headline totals and per-period breakdown', async () => {
		render( <WordAdsEarningsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Total earnings' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Amount owed' ) ).toBeInTheDocument();
		// Headline totals as currency.
		expect( screen.getByText( '$128.42' ) ).toBeInTheDocument();
		// Section headings for the earnings sources that have data.
		expect( screen.getByText( 'WordAds' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sponsored content' ) ).toBeInTheDocument();
		// Empty sources are omitted.
		expect( screen.queryByText( 'Adjustments' ) ).not.toBeInTheDocument();
		// A per-period row: formatted period, currency amount, and status label.
		expect( screen.getByText( 'Jun 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Unpaid' ) ).toBeInTheDocument();
	} );

	it( 'requests the WordAds earnings endpoint', async () => {
		render( <WordAdsEarningsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Total earnings' ) ).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'wordads/earnings' );
	} );

	it( 'explains payment statuses via a title tooltip', async () => {
		render( <WordAdsEarningsWidget attributes={ {} } /> );

		const unpaid = await screen.findByText( 'Unpaid' );
		expect( unpaid ).toHaveAttribute(
			'title',
			'Payment is on hold until the end of the current month.'
		);
		expect( screen.getByText( 'Pending (Missing Tax Info)' ) ).toHaveAttribute(
			'title',
			expect.stringContaining( 'You can provide tax information' )
		);
	} );

	it( 'renders the empty state when there are no earnings', async () => {
		mockApiFetch.mockResolvedValue( { earnings: {} } );

		render( <WordAdsEarningsWidget attributes={ {} } /> );

		await expect( screen.findByText( /No WordAds earnings yet/ ) ).resolves.toBeInTheDocument();
	} );
} );

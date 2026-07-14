/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsHighlightsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// total_earnings − total_amount_owed = paid, so Earnings/$1,200.00,
// Paid/$900.00, Outstanding/$300.00 pin both the field wiring and the
// subtraction.
const EARNINGS_RESPONSE = {
	earnings: {
		total_earnings: 1200,
		total_amount_owed: 300,
	},
};

describe( 'WordAdsHighlightsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( EARNINGS_RESPONSE );
	} );

	it( 'requests the wordads/earnings endpoint and renders every earnings card', async () => {
		render( <WordAdsHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Earnings' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Paid' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Outstanding amount' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'proxy/v1.1/wordads/earnings' );
	} );

	it( 'maps earnings to Earnings, derives Paid as earnings − outstanding, and shows Outstanding', async () => {
		render( <WordAdsHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Earnings' ) ).resolves.toBeInTheDocument();

		// Tiles render in a fixed order: Earnings, Paid, Outstanding. Reading the
		// currency values in document order pins the field-to-tile wiring and the
		// paid subtraction (1200 − 300 = 900).
		const values = screen.getAllByText( /^\$[\d,]+\.\d{2}$/ ).map( el => el.textContent );
		expect( values ).toEqual( [ '$1,200.00', '$900.00', '$300.00' ] );
	} );

	it( 'shows the error state when the earnings request fails', async () => {
		// Reject with a non-retryable (403) error so React Query surfaces the
		// error state immediately instead of retrying with backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <WordAdsHighlightsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "We couldn't load WordAds earnings. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Earnings' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the loading overlay while the earnings request is pending', () => {
		// A promise that never settles keeps the query in its loading state.
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		const { container } = render( <WordAdsHighlightsWidget attributes={ {} } /> );

		// WidgetLoadingOverlay renders a WP Spinner (role="presentation", no
		// accessible name), so the class is the only stable handle for it.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- No accessible role/text on the spinner to query.
		expect( container.querySelector( '.components-spinner' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Earnings' ) ).not.toBeInTheDocument();
	} );

	it( 'hides a card when it is not in the metrics attribute', async () => {
		render( <WordAdsHighlightsWidget attributes={ { metrics: [ 'earnings' ] } } /> );

		await expect( screen.findByText( 'Earnings' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Paid' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Outstanding amount' ) ).not.toBeInTheDocument();
	} );

	it( 'prompts to select a metric when the metrics attribute is empty', async () => {
		render( <WordAdsHighlightsWidget attributes={ { metrics: [] } } /> );

		await expect(
			screen.findByText( 'Select at least one metric to display.' )
		).resolves.toBeInTheDocument();
	} );
} );

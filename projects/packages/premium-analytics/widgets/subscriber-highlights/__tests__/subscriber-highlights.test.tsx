/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import SubscriberHighlightsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const COUNTS_RESPONSE = {
	counts: {
		total_subscribers: 12840,
		email_subscribers: 9320,
		paid_subscribers: 1180,
		social_followers: 2340,
	},
};

describe( 'SubscriberHighlightsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( COUNTS_RESPONSE );
	} );

	it( 'requests the subscribers/counts endpoint and renders every metric tile', async () => {
		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Total subscribers' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Paid subscribers' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Free subscribers' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social followers' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'proxy/v2/subscribers/counts' );
	} );

	it( 'maps each subscriber count to its matching tile', async () => {
		// Distinct sub-1000 values so the `useMultipliers` formatter leaves them
		// unabbreviated, and `social_followers` is omitted so the `?? 0` fallback
		// renders. The `Free` tile reads `email_subscribers`, so a mis-wired field
		// (or a dropped fallback) changes this sequence and fails the test.
		mockApiFetch.mockResolvedValue( {
			counts: {
				total_subscribers: 428,
				email_subscribers: 186,
				paid_subscribers: 317,
			},
		} );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Total subscribers' ) ).resolves.toBeInTheDocument();

		// Tiles render in a fixed order: Total, Paid, Free, Social. Reading the
		// metric values in document order pins the field-to-tile wiring.
		const values = screen.getAllByText( /^\d+$/ ).map( el => el.textContent );
		expect( values ).toEqual( [ '428', '317', '186', '0' ] );
	} );

	it( 'shows the error placeholder when the counts request fails', async () => {
		// Reject with a non-retryable (403) error so React Query surfaces the
		// error state immediately instead of retrying with backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Unable to load subscriber highlights.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Total subscribers' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the loading overlay while the counts request is pending', () => {
		// A promise that never settles keeps the query in its loading state.
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		const { container } = render( <SubscriberHighlightsWidget attributes={ {} } /> );

		// WidgetLoadingOverlay renders a WP Spinner (role="presentation", no
		// accessible name), so the class is the only stable handle for it.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- No accessible role/text on the spinner to query.
		expect( container.querySelector( '.components-spinner' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Total subscribers' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Unable to load subscriber highlights.' ) ).not.toBeInTheDocument();
	} );

	it( 'hides a metric tile when it is not in the metrics attribute', async () => {
		render( <SubscriberHighlightsWidget attributes={ { metrics: [ 'total', 'free' ] } } /> );

		await expect( screen.findByText( 'Total subscribers' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Free subscribers' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Paid subscribers' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Social followers' ) ).not.toBeInTheDocument();
	} );

	it( 'prompts to select a metric when the metrics attribute is empty', async () => {
		render( <SubscriberHighlightsWidget attributes={ { metrics: [] } } /> );

		await expect(
			screen.findByText( 'Select at least one metric to display.' )
		).resolves.toBeInTheDocument();
	} );
} );

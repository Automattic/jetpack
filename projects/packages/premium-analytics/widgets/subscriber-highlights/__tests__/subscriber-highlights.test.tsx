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

	it( 'hides a metric tile when its visibility attribute is off', async () => {
		render( <SubscriberHighlightsWidget attributes={ { showPaid: false, showSocial: false } } /> );

		await expect( screen.findByText( 'Total subscribers' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Free subscribers' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Paid subscribers' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Social followers' ) ).not.toBeInTheDocument();
	} );

	it( 'prompts to select a metric when every tile is disabled', async () => {
		render(
			<SubscriberHighlightsWidget
				attributes={ {
					showTotal: false,
					showPaid: false,
					showFree: false,
					showSocial: false,
				} }
			/>
		);

		await expect(
			screen.findByText( 'Select at least one metric to display.' )
		).resolves.toBeInTheDocument();
	} );
} );

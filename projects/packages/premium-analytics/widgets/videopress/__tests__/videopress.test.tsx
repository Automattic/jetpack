/**
 * External dependencies
 */
import { GlobalErrorProvider, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import VideoPressWidget from '../render';
import type { ReactElement } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Build a raw Stats "video-plays" response that satisfies both the summarized
// (multi-day) and single-day read paths of `sanitizeStatsVideoPlaysResponse`.
const buildResponse = ( videos: Array< { post_id: number; title: string; plays: number } > ) => {
	const date = '2026-06-16';
	const rows = videos.map( video => ( {
		post_id: video.post_id,
		title: video.title,
		url: `https://example.com/video/${ video.post_id }/`,
		plays: video.plays,
		impressions: video.plays * 2,
		watch_time: video.plays * 10,
		retention_rate: 60,
	} ) );

	return { date, period: 'day', summary: { plays: rows }, days: { [ date ]: { plays: rows } } };
};

const VIDEO_PLAYS_RESPONSE = buildResponse( [
	{ post_id: 101, title: 'Getting Started Walkthrough', plays: 3820 },
	{ post_id: 102, title: 'Product Launch Highlights', plays: 2640 },
] );

// The dashboard wraps widgets in a GlobalErrorProvider, so mirror it here to
// render the widget as it runs in product.
const renderInDashboard = ( ui: ReactElement ) =>
	render( <GlobalErrorProvider>{ ui }</GlobalErrorProvider> );

describe( 'VideoPressWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( VIDEO_PLAYS_RESPONSE );
	} );

	it( 'renders the fetched videos as leaderboard rows', async () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		await expect( screen.findByText( 'Getting Started Walkthrough' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Product Launch Highlights' ) ).toBeInTheDocument();
	} );

	it( 'links each row to the video page', async () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		// The Link's new-tab icon appends "(opens in a new tab)" to the accessible name.
		const link = await screen.findByRole( 'link', { name: /Getting Started Walkthrough/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/video/101/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'requests the dashboard date range from report params', async () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } } />
		);

		await expect( screen.findByText( 'Getting Started Walkthrough' ) ).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ]?.[ 0 ]?.path ?? '';
		expect( requestedPath ).toContain( 'stats/video-plays' );
		// The query factory derives the Stats date params from `reportParams`:
		// `to` becomes the end `date` and the inclusive range length becomes `days`.
		expect( requestedPath ).toContain( 'start_date=2026-03-01' );
		expect( requestedPath ).toContain( 'date=2026-03-10' );
		expect( requestedPath ).toContain( 'days=10' );
	} );

	it( 'shows the empty state when the period has no video plays', async () => {
		mockApiFetch.mockResolvedValue( buildResponse( [] ) );

		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		await expect(
			screen.findByText( 'No VideoPress plays in this period.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the error state with a retry action when the request fails', async () => {
		// Reject with a non-retryable (403) error so React Query surfaces the
		// error state immediately instead of retrying with backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		await expect(
			screen.findByText( "We couldn't load video plays. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );

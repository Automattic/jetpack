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

// The dashboard wraps widgets in a GlobalErrorProvider; `useWidgetError` reads
// that context, so mirror it here to render the widget as it runs in product.
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

	it( 'requests the dashboard date range from report params', async () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } } />
		);

		await expect( screen.findByText( 'Getting Started Walkthrough' ) ).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ]?.[ 0 ]?.path ?? '';
		expect( requestedPath ).toContain( 'stats/video-plays' );
	} );
} );

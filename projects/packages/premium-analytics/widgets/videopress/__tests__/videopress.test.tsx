/**
 * External dependencies
 */
import { GlobalErrorProvider, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import type { ReactElement } from 'react';
/**
 * Internal dependencies
 */
import VideoPressWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Build a raw Stats "video-plays" response that satisfies both the summarized
// (multi-day) and single-day read paths of `sanitizeStatsVideoPlaysResponse`.
const buildResponse = (
	videos: Array< { post_id?: number; title: string; plays: number; url?: string | null } >
) => {
	const date = '2026-06-16';
	const rows = videos.map( video => ( {
		post_id: video.post_id,
		title: video.title,
		url: video.url === undefined ? `https://example.com/video/${ video.post_id }/` : video.url,
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

	it( 'links each ID-backed title internally with the shared date window and no icon link', async () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		const detailLink = await screen.findByRole( 'link', {
			name: 'Getting Started Walkthrough',
		} );
		expect( detailLink ).toHaveAttribute(
			'href',
			'/video/101?from=2026-06-01&to=2026-06-16&interval=day&date_type=created'
		);
		expect( detailLink ).not.toHaveAttribute( 'target' );
		expect( detailLink ).toHaveAttribute( 'title', 'Getting Started Walkthrough' );
		expect(
			screen.queryByRole( 'link', {
				name: /Open Getting Started Walkthrough in a new tab/,
			} )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the external title link when a row has no numeric ID', async () => {
		mockApiFetch.mockResolvedValue(
			buildResponse( [
				{
					title: 'Legacy video',
					plays: 12,
					url: 'https://example.com/video/legacy/',
				},
			] )
		);

		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		const link = await screen.findByRole( 'link', { name: /Legacy video/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/video/legacy/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( link ).toHaveAttribute( 'title', 'Legacy video' );
		expect(
			screen.queryByRole( 'link', { name: /Open Legacy video in a new tab/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the title tooltip when a row has neither an ID nor a URL', async () => {
		mockApiFetch.mockResolvedValue(
			buildResponse( [ { title: 'Unlinked video', plays: 8, url: null } ] )
		);

		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-06-01', to: '2026-06-16' } } } />
		);

		const title = await screen.findByText( 'Unlinked video' );
		expect( title ).not.toHaveRole( 'link' );
		// The tooltip lives on the plain-branch wrapper; the label itself sits in
		// the inner text span shared by every branch.
		expect( screen.getByTitle( 'Unlinked video' ) ).toBeInTheDocument();
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

	it( 'links to the Videos report', () => {
		renderInDashboard(
			<VideoPressWidget attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } } />
		);

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/videos' )
		);
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

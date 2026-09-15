/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AuthorTopPostsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+00:00',
	to: '2026-07-07T23:59:59.999+00:00',
	author_id: 7,
};

// Summarized `stats/top-authors`: this author's posts arrive ranked already.
const TOP_AUTHORS_SUMMARY = {
	date: '2026-07-07',
	period: 'day',
	summary: {
		authors: [
			{
				name: 'Other',
				author_id: 3,
				views: 90,
				posts: [ { id: 9, title: 'Not hers', url: 'https://example.com/not-hers/', views: 90 } ],
			},
			{
				name: 'Priya',
				author_id: 7,
				views: 30,
				posts: [
					{ id: 1, title: 'Top post', url: 'https://example.com/top/', views: 20 },
					{ id: 2, title: 'Second post', url: 'https://example.com/second/', views: 10 },
				],
			},
		],
	},
};

describe( 'AuthorTopPostsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'lists only this author’s posts, linked to their detail pages on the window', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const top = await screen.findByRole( 'link', { name: 'Top post' } );
		expect( top ).toHaveAttribute(
			'href',
			expect.stringMatching( /^\/post\/1\?from=2026-07-01.*to=2026-07-07/ )
		);
		expect( screen.getByRole( 'link', { name: 'Second post' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Not hers' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringMatching( /^\/reports\/authors\?/ )
		);

		const requestedPath = decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string );
		expect( requestedPath ).toContain( 'stats/top-authors' );
		expect( requestedPath ).toContain( 'max=0' );
	} );

	it( 'shows the no-views empty state for an author missing from the period', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_SUMMARY );

		render(
			<AuthorTopPostsWidget attributes={ { reportParams: { ...WINDOW_PARAMS, author_id: 42 } } } />
		);

		await expect(
			screen.findByText( 'No views recorded for this author’s posts in this period.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders the scopeless empty state and makes no request without an author scope', async () => {
		render( <AuthorTopPostsWidget attributes={ { reportParams: DEFAULT_PARAMS } } /> );

		await expect(
			screen.findByText( 'Open an author to see their top posts here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'surfaces a retryable error when the request fails', async () => {
		mockApiFetch.mockRejectedValue( { error: 'unauthorized', status: 403 } );

		render( <AuthorTopPostsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "We couldn't load this author's posts. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );

/**
 * External dependencies
 */
import { queryClient, type ReportParams } from '@jetpack-premium-analytics/data';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClientWrapper as wrapper } from '../../test-utils';
import { usePopularPost } from '../use-popular-post';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const reportParams = { from: '2026-06-01', to: '2026-06-30' } as ReportParams;

// A multi-day range is requested with `summarize=1`, so the rows live under
// `summary.postviews`.
const topPostsResponse = {
	date: '2026-06-30',
	period: 'day',
	days: {},
	summary: {
		postviews: [
			// A page outranks the top post: the hook must skip it.
			{ id: 9, title: 'About', type: 'page', href: 'https://example.com/about/', views: 900 },
			{
				id: 7,
				title: 'Winning post',
				type: 'post',
				href: 'https://example.com/winning-post/',
				date: '2026-06-02',
				views: 420,
			},
			{
				id: 8,
				title: 'Runner up',
				type: 'post',
				href: 'https://example.com/runner-up/',
				date: '2026-06-03',
				views: 120,
			},
		],
		total_views: 1440,
	},
};

const postContentResponse = [
	{
		id: 7,
		title: { rendered: 'Winning &#038; popular post' },
		link: 'https://example.com/winning-post/',
		date: '2026-06-02T08:00:00',
		_embedded: {
			'wp:featuredmedia': [ { source_url: 'https://example.com/hero.jpg', alt_text: 'Hero' } ],
		},
	},
];

const postStatsResponse = { views: 9999, like_count: 12, post: { comment_count: 4 } };

type MockedFetchArgs = { path?: string; url?: string };

function mockEndpoints( { failPostStats = false }: { failPostStats?: boolean } = {} ) {
	mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
		const target = path || url;

		if ( target.includes( 'stats/top-posts' ) ) {
			return Promise.resolve( topPostsResponse );
		}

		if ( target.includes( 'stats/post/' ) ) {
			return failPostStats
				? Promise.reject( new Error( 'User cannot access this private blog.' ) )
				: Promise.resolve( postStatsResponse );
		}

		if ( target.startsWith( '/wp/v2/posts' ) ) {
			return Promise.resolve( postContentResponse );
		}

		return Promise.resolve( {} );
	} );
}

describe( 'usePopularPost', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'picks the most-viewed post, with period views and all-time engagement', async () => {
		mockEndpoints();

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () =>
			expect( result.current.post ).toEqual( {
				id: 7,
				// Core content wins over the report row: it is entity-decoded.
				title: 'Winning & popular post',
				url: 'https://example.com/winning-post/',
				date: '2026-06-02T08:00:00',
				imageUrl: 'https://example.com/hero.jpg',
				imageAlt: 'Hero',
				// Period views come from the report, not from the all-time `stats/post` value.
				views: 420,
				likeCount: 12,
				commentCount: 4,
			} )
		);
		expect( result.current.isError ).toBe( false );
	} );

	it( 'requests the resolved post from the core posts endpoint', async () => {
		mockEndpoints();

		renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () => {
			const contentPath = mockApiFetch.mock.calls
				.map( ( [ options ] ) => ( options as MockedFetchArgs ).path ?? '' )
				.find( path => path.startsWith( '/wp/v2/posts' ) );

			expect( contentPath ).toContain( 'include=7' );
		} );
	} );

	it( 'still renders the post with zeroed engagement when stats/post fails', async () => {
		mockEndpoints( { failPostStats: true } );

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () => expect( result.current.post?.views ).toBe( 420 ) );
		expect( result.current.post?.likeCount ).toBe( 0 );
		expect( result.current.post?.commentCount ).toBe( 0 );
		expect( result.current.isError ).toBe( false );
	} );

	it( 'returns a null post when the period has no post views', async () => {
		mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
			const target = path || url;

			if ( target.includes( 'stats/top-posts' ) ) {
				return Promise.resolve( {
					date: '2026-06-30',
					period: 'day',
					days: {},
					summary: { postviews: [] },
				} );
			}

			return Promise.resolve( {} );
		} );

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.post ).toBeNull();
	} );
} );

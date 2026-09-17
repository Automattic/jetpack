/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { getMockRouteLinkUrl } from '../../../tests/js/route-test-utils';
import LatestPostWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const REPORT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

describe( 'LatestPostWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( [] );
	} );

	it( 'shows the scopeless empty state, and makes no request, when author-scoped without an author', async () => {
		render(
			<LatestPostWidget attributes={ { reportParams: REPORT_PARAMS, authorScoped: true } } />
		);

		await expect(
			screen.findByText( 'Open an author to see their latest post here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'picks across the site when the instance is not author-scoped', async () => {
		render(
			<LatestPostWidget attributes={ { reportParams: { ...REPORT_PARAMS, author_id: 7 } } } />
		);

		await expect(
			screen.findByText( 'Publish a post to see its stats here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).not.toContain( 'author=' );
	} );

	it( 'links the post to its detail page with the Posts report origin', async () => {
		mockApiFetch.mockImplementation(
			( { path = '', url = '' }: { path?: string; url?: string } ) => {
				const target = path || url;

				if ( target.startsWith( '/wp/v2/posts' ) ) {
					return Promise.resolve( [
						{
							id: 779,
							title: { rendered: 'Hello world' },
							link: 'https://example.com/hello-world/',
							date: '2026-06-22T10:00:00',
						},
					] );
				}

				if ( target.includes( 'stats/post/' ) ) {
					return Promise.resolve( {
						views: 3820,
						like_count: 24,
						post: { comment_count: 8 },
					} );
				}

				return Promise.resolve( {} );
			}
		);

		render(
			<LatestPostWidget attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } } />
		);

		const link = await screen.findByRole( 'link', { name: 'Hello world' } );
		const { pathname, searchParams } = getMockRouteLinkUrl( link );

		expect( pathname ).toBe( '/post/779' );
		expect( searchParams.get( 'from' ) ).toBe( '2026-03-01' );
		expect( searchParams.get( 'to' ) ).toBe( '2026-03-10' );
		expect( searchParams.get( 'ref' ) ).toBe( 'posts' );
		expect( searchParams.get( 'ref_section' ) ).toBe( 'posts-pages' );
		expect( searchParams.get( 'post_url' ) ).toBe( 'https://example.com/hello-world/' );
	} );

	it( 'names the Authors report when the instance is author-scoped', async () => {
		mockApiFetch.mockImplementation(
			( { path = '', url = '' }: { path?: string; url?: string } ) => {
				const target = path || url;

				if ( target.startsWith( '/wp/v2/posts' ) ) {
					return Promise.resolve( [
						{
							id: 780,
							title: { rendered: 'By Priya' },
							link: 'https://example.com/priya/',
							date: '2026-06-22T10:00:00',
						},
					] );
				}

				if ( target.includes( 'stats/post/' ) ) {
					return Promise.resolve( {
						views: 120,
						like_count: 3,
						post: { comment_count: 1 },
					} );
				}

				return Promise.resolve( {} );
			}
		);

		render(
			<LatestPostWidget
				attributes={ {
					authorScoped: true,
					reportParams: { from: '2026-03-01', to: '2026-03-10', author_id: 7 },
				} }
			/>
		);

		const { searchParams } = getMockRouteLinkUrl(
			await screen.findByRole( 'link', { name: 'By Priya' } )
		);

		expect( searchParams.get( 'ref' ) ).toBe( 'authors' );
		expect( searchParams.get( 'ref_section' ) ).toBeNull();
	} );
} );

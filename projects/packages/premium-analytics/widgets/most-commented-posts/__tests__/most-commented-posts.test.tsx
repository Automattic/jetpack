/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import MostCommentedPostsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'MostCommentedPostsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			date: '2026-07-20',
			authors: [
				{
					name: 'Guest Author',
					comments: 12,
					link: '?s=guest@example.com',
					gravatar: 'https://www.gravatar.com/avatar/guest?s=96',
				},
			],
			posts: [
				{
					id: 42,
					name: 'Hello world',
					comments: 20,
					link: 'https://example.com/hello-world/',
				},
			],
		} );
	} );

	function renderWidget() {
		return render(
			<MostCommentedPostsWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);
	}

	it( 'links a post to its detail page, carrying the permalink along', async () => {
		renderWidget();

		const link = await screen.findByRole( 'link', { name: 'Hello world' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/42' );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/hello-world/' );
		expect( url.searchParams.get( 'ref' ) ).toBe( 'comments' );
		expect( url.searchParams.get( 'ref_section' ) ).toBe( 'posts' );
		expect( link ).not.toHaveAttribute( 'target', '_blank' );
	} );
} );

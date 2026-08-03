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

const posts = [
	{
		id: 42,
		name: 'Hello world',
		comments: 20,
		link: 'https://example.com/hello-world/',
	},
	{
		id: 43,
		name: 'Unsafe permalink',
		comments: 5,
		link: 'javascript:alert(1)',
	},
];

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
			posts,
		} );
	} );

	function renderWidget() {
		return render(
			<MostCommentedPostsWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);
	}

	it( 'links a post to its permalink in a new tab', async () => {
		renderWidget();

		const link = await screen.findByRole( 'link', { name: /Hello world/ } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'drops a permalink that is not a safe http(s) URL, keeping the row', async () => {
		renderWidget();

		await expect( screen.findByText( 'Unsafe permalink' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Unsafe permalink/ } ) ).not.toBeInTheDocument();
	} );

	// Both comment widgets read the same response; this one must show only the
	// posts group, never the author rows the sibling widget renders.
	it( 'shows only the posts group from the shared report', async () => {
		renderWidget();

		await expect( screen.findByText( 'Hello world' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Guest Author' ) ).not.toBeInTheDocument();
	} );
} );

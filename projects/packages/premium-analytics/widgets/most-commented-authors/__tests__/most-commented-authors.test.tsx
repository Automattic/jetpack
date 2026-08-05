/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import MostCommentedAuthorsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'MostCommentedAuthorsWidget', () => {
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
				{
					name: 'Member Author',
					comments: 8,
					link: '?user_id=1662656',
					gravatar: 'https://www.gravatar.com/avatar/member?s=96',
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
			<MostCommentedAuthorsWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);
	}

	it( 'links guest authors to the comments search with a decorative avatar', async () => {
		renderWidget();

		const link = await screen.findByRole( 'link', { name: /Guest Author/ } );
		expect( link ).toHaveAttribute( 'href', 'edit-comments.php?s=guest%40example.com' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( within( link ).getByRole( 'presentation' ) ).toHaveAttribute( 'alt', '' );
	} );

	it( 'keeps WordPress.com users unlinked and preserves their avatar alt text', async () => {
		renderWidget();

		await expect( screen.findByText( 'Member Author' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Member Author/ } ) ).not.toBeInTheDocument();
		expect( screen.getByAltText( 'Avatar of Member Author' ) ).toBeInTheDocument();
	} );

	// Both comment widgets read the same response; this one must show only the
	// authors group, never the posts rows the sibling widget renders.
	it( 'shows only the authors group from the shared report', async () => {
		renderWidget();

		await expect( screen.findByText( 'Guest Author' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Hello world' ) ).not.toBeInTheDocument();
	} );
} );

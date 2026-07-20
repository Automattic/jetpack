/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import CommentsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// The shared CSS stub returns an empty object, so LeaderboardLabel's `styles.*`
// lookups would all be undefined and the `hugTrailing` modifier could not be
// observed. Provide identity class names for the leaderboard label so the
// linked/unlinked padding wiring is assertable.
jest.mock(
	'../../../packages/widgets-toolkit/src/components/chart-leaderboard/leaderboard-label.module.scss',
	() => ( {
		container: 'container',
		hugTrailing: 'hugTrailing',
		label: 'label',
		labelImage: 'labelImage',
	} )
);

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'CommentsWidget', () => {
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
			posts: [],
		} );
	} );

	it( 'links guest authors to the comments search with a decorative avatar', async () => {
		render(
			<CommentsWidget
				attributes={ {
					view: 'authors',
					reportParams: getDefaultQueryParams( false ),
				} }
			/>
		);

		const link = await screen.findByRole( 'link', { name: /Guest Author/ } );
		expect( link ).toHaveAttribute( 'href', 'edit-comments.php?s=guest%40example.com' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( within( link ).getByRole( 'presentation' ) ).toHaveAttribute( 'alt', '' );
	} );

	it( 'keeps WordPress.com users unlinked and preserves their avatar alt text', async () => {
		render(
			<CommentsWidget
				attributes={ {
					view: 'authors',
					reportParams: getDefaultQueryParams( false ),
				} }
			/>
		);

		await expect( screen.findByText( 'Member Author' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Member Author/ } ) ).not.toBeInTheDocument();
		expect( screen.getByAltText( 'Avatar of Member Author' ) ).toBeInTheDocument();
	} );

	it( 'hugs the new-tab arrow for linked authors but keeps trailing padding for unlinked ones', async () => {
		render(
			<CommentsWidget
				attributes={ {
					view: 'authors',
					reportParams: getDefaultQueryParams( false ),
				} }
			/>
		);

		// Linked author: the label sits inside the out-linking anchor, whose
		// appended new-tab arrow should hug the name, so trailing padding is dropped.
		const link = await screen.findByRole( 'link', { name: /Guest Author/ } );
		// eslint-disable-next-line testing-library/no-node-access -- the hug modifier lands on the label element inside the anchor.
		expect( link.firstChild ).toHaveClass( 'container', 'hugTrailing' );

		// Unlinked author: a bare label with no following arrow, so the trailing
		// padding is preserved (no hug-trailing modifier).
		// eslint-disable-next-line testing-library/no-node-access -- reach the bare label wrapping the unlinked author name.
		const unlinkedLabel = screen.getByText( 'Member Author' ).parentElement;
		expect( unlinkedLabel ).toHaveClass( 'container' );
		expect( unlinkedLabel ).not.toHaveClass( 'hugTrailing' );
	} );
} );

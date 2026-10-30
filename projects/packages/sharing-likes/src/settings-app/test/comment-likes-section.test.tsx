import { screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { CommentLikesSection } from '../sections/comment-likes-section';
import { baseStatus, renderWithData, setScriptData } from './helpers';
import type { SectionState } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'CommentLikesSection', () => {
	it.each( [
		[ true, 'off', true ],
		[ true, 'block_call_to_action', true ],
		[ true, 'configure', false ],
		[ false, 'off', false ],
	] as [ boolean, SectionState, boolean ][] )(
		'follows Likes settings %s, likes %s: sitewide default shown %s',
		( follows, likesState, shown ) => {
			renderWithData( <CommentLikesSection />, {
				status: {
					...baseStatus,
					likes: { ...baseStatus.likes, state: likesState, supported: true },
					comment_likes: { supported: true, follows_likes_settings: follows },
				},
			} );

			expect(
				screen.getByLabelText( 'Allow readers to like individual comments' )
			).toBeInTheDocument();
			expect( screen.queryByRole( 'radio', { name: 'On for all posts' } ) !== null ).toBe( shown );
		}
	);

	it( 'links to Discussion settings when comments are closed on new posts', () => {
		setScriptData( { comments_closed_by_default: true } );
		renderWithData( <CommentLikesSection /> );

		expect( screen.getByText( /Comments are turned off for new posts\./ ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Change this in Discussion settings' } )
		).toHaveAttribute( 'href', 'https://example.com/wp-admin/options-discussion.php' );
		// Each post can still turn comments on, so the switch stays usable.
		expect( screen.getByLabelText( 'Allow readers to like individual comments' ) ).toBeEnabled();
	} );

	it( 'says nothing about comments when new posts allow them', () => {
		renderWithData( <CommentLikesSection /> );

		expect( screen.queryByText( /Comments are turned off/ ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Change this in Discussion settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'only explains offline mode when Comment Likes cannot run', () => {
		setScriptData( { comments_closed_by_default: true } );
		renderWithData( <CommentLikesSection />, {
			status: { ...baseStatus, comment_likes: { supported: false, follows_likes_settings: false } },
		} );

		expect(
			screen.getByText(
				'Comment Likes need a connection to WordPress.com, which is unavailable while your site is in Offline Mode.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Allow readers to like individual comments' )
		).not.toBeInTheDocument();
		expect( screen.queryByText( /Comments are turned off/ ) ).not.toBeInTheDocument();
	} );
} );

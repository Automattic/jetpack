import { screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { CommentLikesSection } from '../sections/comment-likes-section';
import { baseStatus, renderWithData, resetNotices, setScriptData } from './helpers';
import type { SectionState } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
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
					likes: { state: likesState, supported: true },
					comment_likes: { supported: true, follows_likes_settings: follows },
				},
			} );

			expect(
				screen.getByLabelText( 'Allow readers to like individual comments' )
			).toBeInTheDocument();
			expect( screen.queryByRole( 'radio', { name: 'On for all posts' } ) !== null ).toBe( shown );
		}
	);

	it( 'only explains offline mode when Comment Likes cannot run', () => {
		renderWithData( <CommentLikesSection />, {
			status: { ...baseStatus, comment_likes: { supported: false, follows_likes_settings: false } },
		} );

		expect(
			screen.getByText(
				'Comment Likes need a connection to WordPress.com, which is unavailable while your site is in offline mode.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Allow readers to like individual comments' )
		).not.toBeInTheDocument();
	} );
} );

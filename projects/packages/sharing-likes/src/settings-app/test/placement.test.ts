import { placementHeading, placementSummary, type SummaryFeature } from '../placement';
import { baseStatus, placementChoices } from './helpers';
import type { SectionState, Status } from '../types';

/**
 * Status with the three inputs the heading reads.
 *
 * @param sharing  - Sharing state.
 * @param likes    - Likes state.
 * @param comments - Whether Comment Likes follow the Likes settings.
 * @return Status.
 */
function statusWith( sharing: SectionState, likes: SectionState, comments: boolean ): Status {
	return {
		...baseStatus,
		sharing: { state: sharing },
		likes: { state: likes, supported: true },
		comment_likes: { supported: true, follows_likes_settings: comments },
	};
}

describe( 'placementHeading', () => {
	it.each( [
		[
			'configure',
			'configure',
			true,
			'Where sharing buttons, Like buttons, and Comment Likes appear',
		],
		[ 'configure_with_block_nudge', 'configure', false, 'Where sharing and Like buttons appear' ],
		[ 'configure', 'off', true, 'Where sharing buttons and Comment Likes appear' ],
		[ 'off', 'configure', true, 'Where Like buttons and Comment Likes appear' ],
		[ 'block_call_to_action', 'configure', false, 'Where Like buttons appear' ],
		[ 'off', 'off', true, 'Where Comment Likes appear' ],
		[ 'configure', 'block_call_to_action', false, 'Where sharing buttons appear' ],
	] as const )(
		'sharing %s, likes %s, comments follow %s: %s',
		( sharing, likes, comments, heading ) => {
			expect( placementHeading( statusWith( sharing, likes, comments ) ) ).toBe( heading );
		}
	);
} );

describe( 'placementSummary', () => {
	it.each( [
		[
			'sharing',
			'Sharing buttons currently appear on: Posts, my_cpt.',
			'Sharing buttons are currently not shown anywhere.',
		],
		[
			'likes',
			'Like buttons currently appear on: Posts, my_cpt.',
			'Like buttons are currently not shown anywhere.',
		],
		[
			'comment-likes',
			'Comment Likes currently appear on comments on: Posts, my_cpt.',
			'Comment Likes are currently not shown anywhere.',
		],
	] as [ SummaryFeature, string, string ][] )( '%s', ( feature, somewhere, nowhere ) => {
		// An unregistered post type falls back to its slug, as `label_for()` does.
		expect( placementSummary( feature, [ 'post', 'my_cpt' ], placementChoices ) ).toBe( somewhere );
		expect( placementSummary( feature, [], placementChoices ) ).toBe( nowhere );
	} );
} );

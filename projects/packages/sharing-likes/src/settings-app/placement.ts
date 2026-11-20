import { __, sprintf } from '@wordpress/i18n';
import { configures, type PlacementChoice, type Status } from './types';

export type SummaryFeature = 'sharing' | 'likes' | 'comment-likes';

/**
 * Heading naming the features placement governs, as `Placement_Section::heading()` does.
 *
 * @param status - Status.
 * @return Heading.
 */
export function placementHeading( status: Status ): string {
	const sharing = configures( status.sharing.state );
	const likes = configures( status.likes.state );
	const comments = status.comment_likes.follows_likes_settings;

	if ( sharing && likes && comments ) {
		return __(
			'Where sharing buttons, Like buttons, and Comment Likes appear',
			'jetpack-sharing-likes'
		);
	}
	if ( sharing && likes ) {
		return __( 'Where sharing and Like buttons appear', 'jetpack-sharing-likes' );
	}
	if ( sharing && comments ) {
		return __( 'Where sharing buttons and Comment Likes appear', 'jetpack-sharing-likes' );
	}
	if ( likes && comments ) {
		return __( 'Where Like buttons and Comment Likes appear', 'jetpack-sharing-likes' );
	}
	if ( likes ) {
		return __( 'Where Like buttons appear', 'jetpack-sharing-likes' );
	}
	if ( comments ) {
		return __( 'Where Comment Likes appear', 'jetpack-sharing-likes' );
	}
	return __( 'Where sharing buttons appear', 'jetpack-sharing-likes' );
}

/**
 * Where one feature's buttons appear, as a complete sentence (`Placement_Section::render_summary()`).
 *
 * @param feature - Feature the sentence is about.
 * @param show    - Selected placement slugs.
 * @param choices - Every choice with its label.
 * @return Summary.
 */
export function placementSummary(
	feature: SummaryFeature,
	show: string[],
	choices: PlacementChoice[]
): string {
	const places = show
		.map( slug => choices.find( choice => choice.value === slug )?.label ?? slug )
		.join( ', ' );

	if ( ! places ) {
		switch ( feature ) {
			case 'likes':
				return __( 'Like buttons are currently not shown anywhere.', 'jetpack-sharing-likes' );
			case 'comment-likes':
				return __( 'Comment Likes are currently not shown anywhere.', 'jetpack-sharing-likes' );
			default:
				return __( 'Sharing buttons are currently not shown anywhere.', 'jetpack-sharing-likes' );
		}
	}

	switch ( feature ) {
		case 'likes':
			return sprintf(
				/* translators: %s: comma-separated list of places, for example "Posts, Pages". */
				__( 'Like buttons currently appear on: %s.', 'jetpack-sharing-likes' ),
				places
			);
		case 'comment-likes':
			return sprintf(
				/* translators: %s: comma-separated list of places, for example "Posts, Pages". */
				__( 'Comment Likes currently appear on comments on: %s.', 'jetpack-sharing-likes' ),
				places
			);
		default:
			return sprintf(
				/* translators: %s: comma-separated list of places, for example "Posts, Pages". */
				__( 'Sharing buttons currently appear on: %s.', 'jetpack-sharing-likes' ),
				places
			);
	}
}

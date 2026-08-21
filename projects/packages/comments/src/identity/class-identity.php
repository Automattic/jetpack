<?php
/**
 * The commenter's identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * Who is leaving the comment being written now.
 */
class Identity {

	/**
	 * Who is leaving the comment, as far as this site knows.
	 *
	 * @return array
	 */
	public static function settings() {
		$commenter = wp_get_current_commenter();

		$settings = array(
			'isLoggedIn' => is_user_logged_in(),
			'commenter'  => array(
				'author' => $commenter['comment_author'],
				'email'  => $commenter['comment_author_email'],
				'url'    => $commenter['comment_author_url'],
			),
			'user'       => null,
		);

		if ( is_user_logged_in() ) {
			$user             = wp_get_current_user();
			$settings['user'] = array(
				'avatarUrl'    => get_avatar_url( $user->ID, array( 'size' => 74 ) ),
				'commentingAs' => sprintf(
					/* translators: %s is the display name of the logged-in user. */
					__( 'Commenting as %s', 'jetpack-comments' ),
					$user->display_name
				),
			);
		}

		return $settings;
	}
}

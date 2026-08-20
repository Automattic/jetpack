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
	 * @param int $post_id The post being commented on.
	 * @return array
	 */
	public static function settings( $post_id ) {
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
				'displayName' => $user->display_name,
				'avatarUrl'   => get_avatar_url( $user->ID, array( 'size' => 48 ) ),
				// wp_nonce_url() escapes for HTML, but this is handed to JavaScript,
				// which assigns it verbatim. Left encoded, the nonce arrives as
				// "amp;_wpnonce" and logging out hits the "are you sure" page.
				'logoutUrl'   => html_entity_decode( wp_logout_url( get_permalink( $post_id ) ), ENT_COMPAT ),
			);
		}

		return $settings;
	}
}

<?php
/**
 * The commenter's identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Comments\Identity\Checkpoint;
use Automattic\Jetpack\Comments\Identity\Passport;

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
			// class_exists: on a staged deploy this file and the checkpoint's can
			// land in either order.
			'checkpoint' => class_exists( Checkpoint::class ) ? Checkpoint::settings() : array( 'enabled' => false ),
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
				'isPassport'   => false,
			);

			return $settings;
		}

		if ( ! class_exists( Passport::class ) ) {
			return $settings;
		}

		// A commenter WordPress.com already vouched for, recognised from the
		// first-party cookie, so the form is right on first paint.
		$identity = Passport::read();
		if ( false !== $identity ) {
			$name             = '' !== $identity['name'] ? $identity['name'] : $identity['email'];
			$settings['user'] = array(
				'avatarUrl'    => $identity['avatar'],
				'commentingAs' => sprintf(
					/* translators: %s is the name the commenter signed in with. */
					__( 'Commenting as %s', 'jetpack-comments' ),
					$name
				),
				'isPassport'   => true,
			);
		}

		return $settings;
	}

	/**
	 * Whether a WordPress.com-vouched commenter is recognised on this request.
	 *
	 * @return bool
	 */
	public static function has_passport_identity() {
		return class_exists( Passport::class ) && ! is_user_logged_in() && false !== Passport::read();
	}
}

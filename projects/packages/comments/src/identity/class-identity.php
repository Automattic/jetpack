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
			'identity'   => self::checkpoint_settings(),
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

	/**
	 * What the form needs to open the popup.
	 *
	 * Nothing here is about the visitor. This HTML is page-cached and served to
	 * everyone, so who holds a passport comes from a cookie the script reads.
	 *
	 * @return array
	 */
	private static function checkpoint_settings() {
		$settings = array(
			'providers'     => array(),
			'connect'       => array(),
			'origin'        => Checkpoint::MESSAGE_ORIGIN,
			'codeField'     => Checkpoint::CODE_FIELD,
			'passportField' => Checkpoint::PASSPORT_FIELD,
			'displayCookie' => Passport::DISPLAY_COOKIE,
			'cookiePath'    => COOKIEPATH,
			'cookieDomain'  => COOKIE_DOMAIN ? COOKIE_DOMAIN : '',
			'refreshUrl'    => Checkpoint_Endpoint::connect_url(),
			'logoutUrl'     => admin_url( 'admin-ajax.php' ),
			'logoutAction'  => Checkpoint_Endpoint::LOGOUT_ACTION,
		);

		if ( is_user_logged_in() || ! Checkpoint::is_available() ) {
			return $settings;
		}

		// These URLs get cached too, so visitors share a challenge until it
		// expires. That is fine: the challenge only filters messages to the
		// window that opened the popup, and the refresh route issues a fresh one.
		$settings['providers'] = Checkpoint::PROVIDERS;
		$settings['connect']   = Checkpoint::connect_urls( Checkpoint::challenge() );

		return $settings;
	}
}

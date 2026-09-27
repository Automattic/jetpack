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

		// Nothing under `identity` is about the visitor: the HTML is page-cached
		// and served to everyone, so who holds a passport comes from a cookie.
		$settings = array(
			'isLoggedIn' => is_user_logged_in(),
			'avatarUrl'  => '',
			'commenter'  => array(
				'author' => $commenter['comment_author'],
				'email'  => $commenter['comment_author_email'],
				'url'    => $commenter['comment_author_url'],
			),
			'user'       => null,
			'identity'   => array(
				'blogId'        => Checkpoint::blog_id(),
				'canSignIn'     => false,
				'connect'       => null,
				'connectUrl'    => Checkpoint_Endpoint::connect_url(),
				'emailUrl'      => Checkpoint_Endpoint::email_url(),
				'origin'        => Checkpoint::MESSAGE_ORIGIN,
				'codeField'     => Checkpoint::CODE_FIELD,
				'passportField' => Checkpoint::PASSPORT_FIELD,
				'displayCookie' => Passport::DISPLAY_COOKIE,
				'cookieHash'    => COOKIEHASH,
				'cookiePath'    => COOKIEPATH,
				'cookieDomain'  => COOKIE_DOMAIN ? COOKIE_DOMAIN : '',
				'defaultAvatar' => Avatars::default_url( 80 ),
				'logoutUrl'     => admin_url( 'admin-ajax.php' ),
				'logoutAction'  => Checkpoint_Endpoint::LOGOUT_ACTION,
			),
		);

		if ( is_user_logged_in() ) {
			$user                  = wp_get_current_user();
			$settings['avatarUrl'] = html_entity_decode( (string) get_avatar_url( $user->ID, array( 'size' => 80 ) ), ENT_QUOTES );
			$settings['user']      = array( 'name' => $user->display_name );

			return $settings;
		}

		if ( get_option( 'show_avatars' ) ) {
			$settings['avatarUrl'] = $commenter['comment_author_email']
				? html_entity_decode( (string) get_avatar_url( $commenter['comment_author_email'], array( 'size' => 80 ) ), ENT_QUOTES )
				: Avatars::default_url( 80 );
		}

		if ( ! Checkpoint::is_available() ) {
			return $settings;
		}

		// Visitors share this challenge until it expires: it only filters messages
		// to the window that opened the popup, and the connect route issues fresh ones.
		$challenge = rtrim( strtr( base64_encode( random_bytes( 32 ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- base64url is the wire format.

		$connect = Checkpoint::connect_url( $challenge );

		$settings['identity']['canSignIn'] = true;
		$settings['identity']['connect']   = is_wp_error( $connect ) ? null : $connect;

		return $settings;
	}
}

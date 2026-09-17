<?php
/**
 * Subscriptions from the comment form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Connection\Client;

/**
 * What the form offers to subscribe to, and how the site asks WordPress.com about it.
 *
 * It is all email. A guest's choices post with the comment, in the fields each
 * host's own subscription handler reads. A signed-in reader's are saved as they
 * are made, through Subscriptions_Endpoint, which carries the email to
 * WordPress.com over the blog connection: a Jetpack or Atomic site over HTTP,
 * a Simple site in process. The WordPress.com half is
 * `wpcom/v2/sites/{id}/comments/subscriptions`, and its rules apply: a
 * WordPress.com login's own address is activated at once and offered the
 * reader options, any other address confirms by email first.
 */
class Subscriptions {

	/**
	 * Whether the form offers new-post emails.
	 *
	 * Simple always did under Verbum, whatever the blog's own setting said, so
	 * that stays. Elsewhere it is the Subscriptions module's setting, which
	 * only counts while the module is loaded to handle what the form posts.
	 *
	 * @return bool
	 */
	public static function blog_enabled() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		return class_exists( 'Jetpack_Subscriptions' ) && ! empty( get_option( 'stb_enabled', 1 ) );
	}

	/**
	 * Whether the form offers new-comment emails.
	 *
	 * @return bool
	 */
	public static function comments_enabled() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		return class_exists( 'Jetpack_Subscriptions' ) && ! empty( get_option( 'stc_enabled', 1 ) );
	}

	/**
	 * What the app needs to draw and save the options.
	 *
	 * @return array
	 */
	public static function settings() {
		return array(
			'subscriptions' => array(
				'blog'          => self::blog_enabled(),
				'comments'      => self::comments_enabled(),
				// Notifications reach a WordPress.com account, which a site login only is on Simple.
				'notifications' => is_user_logged_in() && defined( 'IS_WPCOM' ) && IS_WPCOM,
				'url'           => Subscriptions_Endpoint::url(),
				// Simple dispatches the route from admin-ajax, which wants an action.
				'action'        => defined( 'IS_WPCOM' ) && IS_WPCOM ? Subscriptions_Endpoint::ACTION : '',
				// REST cookie authentication sees a site login only with this.
				'nonce'         => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '',
			),
		);
	}

	/**
	 * Whose email would be subscribed: the site's own user, or the passport holder.
	 *
	 * A fresh popup sign-in holds only a code until its first comment posts.
	 * Given that code, it is redeemed here and the passport issued now, so the
	 * comment that follows posts on the passport instead.
	 *
	 * @param string $code The code a fresh sign-in is holding, if any.
	 * @return string|WP_Error|null The email; null when nobody is signed in; the exchange's error when the code is no good.
	 */
	public static function subscriber( $code = '' ) {
		if ( is_user_logged_in() ) {
			return (string) wp_get_current_user()->user_email;
		}

		$passport = Passport::read();

		if ( null === $passport ) {
			if ( '' === $code ) {
				return null;
			}

			$passport = Checkpoint::exchange( $code );

			if ( is_wp_error( $passport ) ) {
				return $passport;
			}

			Passport::issue( $passport );
		}

		return (string) $passport['email'];
	}

	/**
	 * Ask WordPress.com what an email is subscribed to here, changing one thing first if asked.
	 *
	 * Forwards what the form sent and hands back what WordPress.com answered,
	 * as the podcast package's relays do. Validation lives on the far side.
	 *
	 * @param string $email   Whose subscriptions.
	 * @param int    $post_id The post the comment thread belongs to.
	 * @param string $field   The option to change, or '' to only read.
	 * @param string $value   What to set it to.
	 * @return array|\WP_Error The raw Client response.
	 */
	public static function request( $email, $post_id, $field = '', $value = '' ) {
		$body = array(
			'email'   => $email,
			'post_id' => (int) $post_id,
			'field'   => $field,
			'value'   => $value,
		);

		return Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/comments/subscriptions', Checkpoint::blog_id() ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'timeout' => 10,
			),
			(string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);
	}
}

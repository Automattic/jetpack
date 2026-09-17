<?php
/**
 * Subscriptions from the comment form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * What the form offers to subscribe to, and how the site asks WordPress.com about it.
 *
 * A guest's choices post with the comment, in the fields each host's own
 * subscription handler reads. A signed-in reader's are saved as they are made,
 * through Subscriptions_Endpoint, which carries them to WordPress.com over the
 * blog connection: a Jetpack or Atomic site over HTTP, a Simple site in
 * process. The WordPress.com half is `wpcom/v2/sites/{id}/comments/subscriptions`.
 */
class Subscriptions {

	/**
	 * Delivery frequencies a new-post subscription can take.
	 */
	const FREQUENCIES = array( 'instantly', 'daily', 'weekly' );

	/**
	 * Options the endpoint can change.
	 */
	const FIELDS = array( 'email_posts', 'email_comments', 'notify_posts', 'frequency' );

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
				'url'           => admin_url( 'admin-ajax.php' ),
				'action'        => Subscriptions_Endpoint::ACTION,
			),
		);
	}

	/**
	 * Who would be subscribed: the site's own user, or the passport holder.
	 *
	 * The passport carries the signature WordPress.com issued over the email at
	 * the exchange, which is what lets it act on that address without asking
	 * the reader to confirm. A site login carries no such proof off Simple, so
	 * WordPress.com treats its address as it would any other: confirm by email.
	 *
	 * A fresh popup sign-in holds only a code until its first comment posts.
	 * Given that code, it is redeemed here and the passport issued now, so the
	 * comment that follows posts on the passport instead.
	 *
	 * @param string $code The code a fresh sign-in is holding, if any.
	 * @return array|WP_Error|null email, provider, site_commenter_id, email_signature, expires_at, issued;
	 *                             null when nobody is signed in; the exchange's error when the code is no good.
	 */
	public static function subscriber( $code = '' ) {
		if ( is_user_logged_in() ) {
			return array(
				'email'             => (string) wp_get_current_user()->user_email,
				'provider'          => 'site',
				'site_commenter_id' => '',
				'email_signature'   => '',
				'expires_at'        => 0,
				'issued'            => false,
			);
		}

		$passport = Passport::read();
		$issued   = false;

		if ( null === $passport ) {
			if ( '' === $code ) {
				return null;
			}

			$passport = Checkpoint::exchange( $code );

			if ( is_wp_error( $passport ) ) {
				return $passport;
			}

			Passport::issue( $passport );
			$issued = true;
		}

		return array(
			'email'             => $passport['email'],
			'provider'          => $passport['provider'],
			'site_commenter_id' => $passport['site_commenter_id'],
			'email_signature'   => $passport['email_signature'],
			'expires_at'        => (int) $passport['expires_at'],
			'issued'            => $issued,
		);
	}

	/**
	 * Ask WordPress.com what a reader is subscribed to, changing one thing first if asked.
	 *
	 * @param array      $subscriber From subscriber().
	 * @param int        $post_id    The post the comment thread belongs to.
	 * @param array|null $change     field and value, or null to only read.
	 * @return array|WP_Error email, notification, as the app reads them.
	 */
	public static function request( array $subscriber, $post_id, $change = null ) {
		$body = array(
			'email'             => $subscriber['email'],
			'provider'          => $subscriber['provider'],
			'site_commenter_id' => $subscriber['site_commenter_id'],
			'email_signature'   => $subscriber['email_signature'],
			// The signature is over the passport's expiry too, so it goes along.
			'expires_at'        => (int) $subscriber['expires_at'],
			'post_id'           => (int) $post_id,
		);

		if ( null !== $change ) {
			$body['change'] = $change;
		}

		$response = Client::wpcom_json_api_request_as_blog(
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

		if ( is_wp_error( $response ) ) {
			$data = (array) $response->get_error_data();

			return new WP_Error( 'server_error', $response->get_error_message(), array( 'status' => (int) ( $data['status'] ?? 500 ) ) );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 === $status && is_array( $body ) && isset( $body['email'] ) && isset( $body['notification'] ) ) {
			return array(
				'email'        => array(
					'send_posts'              => ! empty( $body['email']['send_posts'] ),
					'send_comments'           => ! empty( $body['email']['send_comments'] ),
					'post_delivery_frequency' => in_array( $body['email']['post_delivery_frequency'] ?? '', self::FREQUENCIES, true ) ? $body['email']['post_delivery_frequency'] : 'daily',
				),
				'notification' => array(
					'send_posts' => ! empty( $body['notification']['send_posts'] ),
				),
			);
		}

		return new WP_Error(
			is_array( $body ) && ! empty( $body['code'] ) ? sanitize_key( (string) $body['code'] ) : 'server_error',
			is_array( $body ) && ! empty( $body['message'] ) ? (string) $body['message'] : '',
			array( 'status' => $status ? $status : 500 )
		);
	}
}

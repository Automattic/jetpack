<?php
/**
 * What the form asks the site about subscriptions.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * One admin-ajax action: read what a signed-in reader is subscribed to, or change one option.
 *
 * Admin-ajax rather than REST for the reason the log-out is: it has to read a
 * first-party cookie, the passport, which only the site's own host receives,
 * and on Simple that host serves no REST API.
 *
 * It carries no nonce, because a page rendered for a logged-out reader is
 * cached and shared, so a nonce in it is everyone's. What stands in: the
 * browser has to say the request is same-origin, and the cookies it acts on
 * are SameSite=Lax, so a page elsewhere cannot send them.
 */
class Subscriptions_Endpoint {

	/**
	 * The admin-ajax action.
	 */
	const ACTION = 'jetpack_comments_subscriptions';

	/**
	 * Whether the action has been hooked.
	 *
	 * @var bool
	 */
	private static $hooked = false;

	/**
	 * Register the action. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$hooked ) {
			return;
		}

		self::$hooked = true;

		add_action( 'wp_ajax_nopriv_' . self::ACTION, array( __CLASS__, 'handle' ) );
		add_action( 'wp_ajax_' . self::ACTION, array( __CLASS__, 'handle' ) );
	}

	/**
	 * Answer the form. Does not return.
	 *
	 * @return void
	 */
	public static function handle() {
		nocache_headers();

		if ( ! self::is_same_origin() ) {
			wp_send_json_error( array( 'code' => 'cross_site' ), 403, JSON_UNESCAPED_SLASHES );
		}

		// On Simple the action is registered ahead of the loader's gates, which skip admin-ajax. Gate here.
		if ( ! Comments::is_enabled() ) {
			wp_send_json_error( array( 'code' => 'not_enabled' ), 404, JSON_UNESCAPED_SLASHES );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- See the class doc: same-origin checked above, no nonce by design.
		$post_id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
		$field   = isset( $_POST['field'] ) ? sanitize_key( wp_unslash( $_POST['field'] ) ) : '';
		$value   = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';
		$code    = isset( $_POST['code'] ) ? sanitize_text_field( wp_unslash( $_POST['code'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( ! $post_id || ! get_post( $post_id ) || ! Comment_Form::enabled_for_post_type( $post_id ) ) {
			wp_send_json_error( array( 'code' => 'invalid_post' ), 400, JSON_UNESCAPED_SLASHES );
		}

		$subscriber = Subscriptions::subscriber( $code );

		if ( null === $subscriber ) {
			wp_send_json_error( array( 'code' => 'not_signed_in' ), 401, JSON_UNESCAPED_SLASHES );
		}

		if ( is_wp_error( $subscriber ) ) {
			$data = (array) $subscriber->get_error_data();
			wp_send_json_error( array( 'code' => $subscriber->get_error_code() ), (int) ( $data['status'] ?? 500 ), JSON_UNESCAPED_SLASHES );
		}

		if ( '' === $subscriber['email'] ) {
			wp_send_json_success(
				array(
					'available' => false,
					'passport'  => $subscriber['issued'],
				),
				200,
				JSON_UNESCAPED_SLASHES
			);
		}

		$change = null;

		if ( '' !== $field ) {
			$change = self::change( $field, $value );

			if ( null === $change ) {
				wp_send_json_error( array( 'code' => 'invalid_change' ), 400, JSON_UNESCAPED_SLASHES );
			}
		}

		$result = Subscriptions::request( $subscriber, $post_id, $change );

		if ( is_wp_error( $result ) ) {
			$data = (array) $result->get_error_data();
			wp_send_json_error( array( 'code' => $result->get_error_code() ), (int) ( $data['status'] ?? 500 ), JSON_UNESCAPED_SLASHES );
		}

		// Tells the form its code is spent and the passport now stands for it.
		$result['passport'] = $subscriber['issued'];

		wp_send_json_success( $result, 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * A change the endpoint can carry, typed.
	 *
	 * @param string $field One of Subscriptions::FIELDS.
	 * @param string $value '1' or '0', or a frequency.
	 * @return array|null field and value, or null when it is not one.
	 */
	private static function change( $field, $value ) {
		if ( 'frequency' === $field ) {
			if ( ! in_array( $value, Subscriptions::FREQUENCIES, true ) ) {
				return null;
			}

			return array(
				'field' => $field,
				'value' => $value,
			);
		}

		if ( ! in_array( $field, Subscriptions::FIELDS, true ) || ! in_array( $value, array( '0', '1' ), true ) ) {
			return null;
		}

		return array(
			'field' => $field,
			'value' => '1' === $value,
		);
	}

	/**
	 * Whether the browser says the request came from this site's own pages.
	 *
	 * Sec-Fetch-Site is what every current browser sends. Origin is checked
	 * too when present, for the one that does not.
	 *
	 * @return bool
	 */
	private static function is_same_origin() {
		$site = isset( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ) : '';

		if ( '' !== $site && 'same-origin' !== $site ) {
			return false;
		}

		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) ) : '';

		if ( 'null' === $origin ) {
			return false;
		}

		if ( '' !== $origin ) {
			$home = wp_parse_url( home_url() );
			$sent = wp_parse_url( $origin );

			if ( ! is_array( $sent ) || strtolower( (string) ( $sent['host'] ?? '' ) ) !== strtolower( (string) ( $home['host'] ?? '' ) ) ) {
				return false;
			}
		}

		return '' !== $site || '' !== $origin;
	}
}

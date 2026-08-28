<?php
/**
 * Trades a one-time code for the commenter's identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

use Automattic\Jetpack\Connection\Client;

/**
 * Redeems a one-time code against the exchange endpoint, server to server, signed
 * with the site's Jetpack blog token. Runs as the comment posts, not when the
 * popup closes; WordPress.com keeps a code for an hour to cover that. No browser
 * and no cookie are involved in the call itself.
 */
class Redeemer {

	/**
	 * Redeem a code for the identity it holds.
	 *
	 * @param string $code The one-time code from WordPress.com.
	 * @return array|\WP_Error The identity (site_commenter_id, provider, name, email, avatar, expires_at),
	 *                         or a WP_Error mirroring the exchange's failure.
	 */
	public static function redeem( $code ) {
		if ( ! is_string( $code ) || ! preg_match( '/^[0-9a-f]{64}$/', $code ) ) {
			return new \WP_Error( 'invalid_code', __( 'The sign-in code is malformed.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$blog_id = Checkpoint::blog_id();
		if ( $blog_id < 1 ) {
			return new \WP_Error( 'not_connected', __( 'This site is not connected to WordPress.com.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/comments/identity/exchange',
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
			),
			wp_json_encode( array( 'code' => $code ), JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error( 'exchange_unreachable', __( 'Could not reach WordPress.com to sign you in.', 'jetpack-comments' ), array( 'status' => 502 ) );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			$slug = is_array( $body ) && isset( $body['code'] ) ? (string) $body['code'] : 'server_error';
			return new \WP_Error( $slug, __( 'WordPress.com could not sign you in.', 'jetpack-comments' ), array( 'status' => $status > 0 ? $status : 502 ) );
		}

		if ( ! is_array( $body ) || empty( $body['site_commenter_id'] ) || empty( $body['provider'] ) ) {
			return new \WP_Error( 'exchange_malformed', __( 'WordPress.com returned an unexpected response.', 'jetpack-comments' ), array( 'status' => 502 ) );
		}

		return array(
			'site_commenter_id' => (string) $body['site_commenter_id'],
			'provider'          => (string) $body['provider'],
			'name'              => isset( $body['name'] ) ? (string) $body['name'] : '',
			'email'             => isset( $body['email'] ) ? (string) $body['email'] : '',
			'avatar'            => isset( $body['avatar'] ) ? (string) $body['avatar'] : '',
			'expires_at'        => isset( $body['expires_at'] ) ? (int) $body['expires_at'] : 0,
		);
	}
}

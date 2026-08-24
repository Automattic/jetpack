<?php
/**
 * REST controller for the reprint exporter secret-rotation endpoint.
 *
 * Requires a Jetpack-signed request (public API proxy only).
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Rest_Authentication;

/**
 * Reprint Exporter REST controller.
 */
class Reprint_Exporter_Rest_Controller extends WP_REST_Controller {

	/**
	 * The API namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wpcomsh/v1';

	/**
	 * The REST base path.
	 *
	 * @var string
	 */
	protected $rest_base = 'reprint';

	/**
	 * Registers the rotate-export-secret route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/rotate-export-secret',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'rotate_secret' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);
	}

	/**
	 * Rotates the shared secret.
	 *
	 * Generates a cryptographically random 64-character hex secret, stores
	 * it in a WordPress option, and returns it. The caller uses this secret
	 * to authenticate export requests via HMAC.
	 *
	 * @return WP_REST_Response The new secret on success, or a 500 error.
	 */
	public function rotate_secret() {
		$secret = bin2hex( random_bytes( 32 ) );

		if ( ! update_option( 'reprint_exporter_secret', $secret, false ) ) {
			return new WP_REST_Response(
				array( 'error' => 'Failed to persist the new secret.' ),
				500
			);
		}

		return new WP_REST_Response( array( 'secret' => $secret ), 200 );
	}

	/**
	 * Permission callback for site-level or administrative user requests.
	 *
	 * A user-token request must map to a site administrator because rotating the
	 * secret grants access to a full-site export.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return Rest_Authentication::is_signed_with_blog_token()
			|| ( Rest_Authentication::is_signed_with_user_token() && current_user_can( 'manage_options' ) );
	}
}

<?php
/**
 * REST controller for the reprint exporter endpoints.
 *
 * All routes require a Jetpack-signed request (public API proxy only).
 *
 * @package wpcomsh
 */

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
	 * Registers routes.
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/activate-export',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'activate_export' ),
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

		// Not atomic: two concurrent rotate calls will both succeed, but
		// the first caller's secret will be overwritten by the second.
		// Acceptable for an admin-only endpoint that is called rarely.
		if ( ! update_option( 'reprint_exporter_secret', $secret, false ) ) {
			return new WP_REST_Response(
				array( 'error' => 'Failed to persist the new secret. The database option update did not succeed.' ),
				500
			);
		}

		return new WP_REST_Response( array( 'secret' => $secret ), 200 );
	}

	/**
	 * Sets the reprint_exporter_enabled option to the current timestamp,
	 * opening the 60-minute activation window for ?reprint-api.
	 *
	 * @return WP_REST_Response
	 */
	public function activate_export() {
		update_option( 'reprint_exporter_enabled', time() );
		return new WP_REST_Response( array( 'activated_until' => time() + HOUR_IN_SECONDS ), 200 );
	}

	/**
	 * Permission callback: only requests signed by WPCOM's Jetpack
	 * connection (i.e. coming through the public API proxy) may call
	 * this. Direct hits from wp-admin or elsewhere get 403.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' )
			&& ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature();
	}
}

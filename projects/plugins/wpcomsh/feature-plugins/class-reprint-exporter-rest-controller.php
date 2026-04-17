<?php
/**
 * REST controller for the reprint exporter secret-rotation endpoint.
 *
 * Exposes POST /wpcomsh/v1/reprint/rotate-export-secret. Registration is
 * gated on _reprint_exporter_is_available() by the caller — this class
 * only defines the route itself and the permission/response callbacks.
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

		// Not atomic: two concurrent rotate calls will both succeed, but
		// the first caller's secret will be overwritten by the second.
		// Acceptable for an admin-only endpoint that is called rarely.
		// Does not affect the secret file override — that must be
		// managed by the site operator directly on disk.
		if ( ! update_option( REPRINT_EXPORTER_SECRET_OPTION, $secret, false ) ) {
			return new WP_REST_Response(
				array( 'error' => 'Failed to persist the new secret. The database option update did not succeed.' ),
				500
			);
		}

		return new WP_REST_Response( array( 'secret' => $secret ), 200 );
	}

	/**
	 * Permission callback: allow super admins only.
	 *
	 * The proxied-Automattician gate is already applied at route-registration
	 * time; this is the second line of defense for direct/forged requests.
	 *
	 * @return bool|WP_Error
	 */
	public function permission_check() {
		if ( is_super_admin() ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to access this endpoint.', 'wpcomsh' ),
			array( 'status' => 403 )
		);
	}
}

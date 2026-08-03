<?php
/**
 * REST controller for the Jetpack Reprint exporter secret-rotation endpoint.
 *
 * Requires a Jetpack-signed request (WordPress.com public API proxy only).
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\Connection\Manager;
use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Reprint exporter REST controller.
 */
class REST_Controller extends WP_REST_Controller {

	/**
	 * The API namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'jetpack/v4';

	/**
	 * The REST base path.
	 *
	 * @var string
	 */
	protected $rest_base = 'reprint';

	/**
	 * Registers the reprint export routes.
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
			'/' . $this->rest_base . '/enable-export',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enable_export' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);
	}

	/**
	 * Opens the 60-minute export window without rotating the secret.
	 *
	 * Purpose-built enable endpoint: a client that already holds a valid
	 * secret can re-open a lapsed window without minting a new one. The
	 * route is only registered when the feature is available, so a 404
	 * here doubles as the client's "is Reprint export available?" probe.
	 *
	 * @return WP_REST_Response The unix timestamp the window was opened at.
	 */
	public function enable_export() {
		return new WP_REST_Response(
			array( 'enabled_at' => Reprint_Exporter::open_export_window() ),
			200
		);
	}

	/**
	 * Rotates the shared secret and opens the export window.
	 *
	 * Generates a cryptographically random 64-character hex secret, stores it
	 * in a WordPress option (autoload disabled), opens the 60-minute export
	 * window, and returns the secret. The caller uses this secret to
	 * authenticate export requests via HMAC.
	 *
	 * Rotating the secret intentionally also opens the export window so the
	 * Pressable client flow is a single round trip: rotate, then immediately
	 * stream from ?reprint-api-jetpack using HMAC.
	 *
	 * @return WP_REST_Response The new secret on success, or a 500 error.
	 */
	public function rotate_secret() {
		$secret = bin2hex( random_bytes( 32 ) );

		if ( ! update_option( Reprint_Exporter::SECRET_OPTION, $secret, false ) ) {
			return new WP_REST_Response(
				array( 'error' => 'Failed to persist the new secret.' ),
				500
			);
		}

		// Open the sliding export window so the client can stream right away.
		Reprint_Exporter::open_export_window();

		return new WP_REST_Response( array( 'secret' => $secret ), 200 );
	}

	/**
	 * Permission callback: only Jetpack-signed requests (public API proxy).
	 *
	 * @return bool
	 */
	public function permission_check() {
		return method_exists( Manager::class, 'verify_xml_rpc_signature' )
			&& ( new Manager() )->verify_xml_rpc_signature();
	}
}

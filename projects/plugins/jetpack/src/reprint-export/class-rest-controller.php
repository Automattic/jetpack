<?php
/**
 * REST controller for Jetpack Reprint export provisioning endpoints.
 *
 * Requires a verified Jetpack user token for a site administrator.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\Connection\Rest_Authentication;
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
	 * Rotates the shared secret.
	 *
	 * Generates a cryptographically random 64-character hex secret, stores it
	 * in a WordPress option (autoload disabled), and returns it. The caller
	 * uses this secret to authenticate export requests via HMAC.
	 *
	 * @return WP_REST_Response The new secret on success, or a 500 error.
	 */
	public function rotate_secret() {
		$secret = bin2hex( random_bytes( 32 ) );

		if ( ! Reprint_Exporter::store_secret( $secret ) ) {
			return new WP_REST_Response(
				array( 'error' => 'Failed to persist the new secret.' ),
				500
			);
		}

		return new WP_REST_Response( array( 'secret' => $secret ), 200 );
	}

	/**
	 * Permission callback: a Jetpack-signed request from a site administrator.
	 *
	 * Deliberately a role check, not a capability one. This hands out a secret
	 * that streams the whole database and file tree, and no capability says
	 * that — `manage_options` is the closest, but plugins grant it to shop
	 * managers and the like. The multisite guard matters: off multisite,
	 * is_super_admin() is a `delete_users` capability test.
	 *
	 * @return bool
	 */
	public function permission_check() {
		if ( ! Rest_Authentication::is_signed_with_user_token() ) {
			return false;
		}

		$user = wp_get_current_user();
		if ( ! $user || ! $user->exists() ) {
			return false;
		}

		return in_array( 'administrator', $user->roles, true )
			|| ( is_multisite() && is_super_admin( $user->ID ) );
	}
}

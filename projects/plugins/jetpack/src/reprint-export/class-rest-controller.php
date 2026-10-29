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
use InvalidArgumentException;
use WordPress\Reprint\Server\PublicKeyServer;
use WordPress\Reprint\Server\Utils;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
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
			'/' . $this->rest_base . '/install-public-key',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'install_public_key' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'public_key' => array(
							'description' => __( 'RSA public key, as PEM or one line of base64.', 'jetpack' ),
							'type'        => 'string',
							'required'    => true,
							'maxLength'   => 4096,
						),
					),
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
	 * The export endpoint, so callers need not know the query-arg convention.
	 *
	 * @return string
	 */
	public function export_url() {
		return home_url( '/?reprint-api-jetpack' );
	}

	/**
	 * Opens the export window without changing the credential, so a client can reopen one that closed.
	 *
	 * Registered only where the feature is available, so clients also use a 404
	 * from here to tell whether the site supports export at all.
	 *
	 * @return WP_REST_Response|WP_Error The unix time the window opened at, or a 409 or 500.
	 */
	public function enable_export() {
		if ( ! Reprint_Exporter::get_state()['has_credential'] ) {
			return new WP_Error(
				'jetpack_reprint_no_credential',
				Utils::key_auth_required()
					? __( 'Install a public key first.', 'jetpack' )
					: __( 'Rotate the export secret first.', 'jetpack' ),
				array( 'status' => 409 )
			);
		}

		$enabled_at = Reprint_Exporter::open_export_window();

		if ( ! Reprint_Exporter::is_export_window_open() ) {
			return new WP_Error(
				'jetpack_reprint_window_not_opened',
				__( 'Failed to open the export window.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		Reprint_Exporter::record_event( 'window_opened', array( 'user_id' => get_current_user_id() ) );

		return new WP_REST_Response(
			array(
				'enabled_at' => $enabled_at,
				'export_url' => $this->export_url(),
			),
			200
		);
	}

	/**
	 * Rotates the shared secret and returns it.
	 *
	 * Uses random_bytes() rather than wp_generate_password(): sites can filter that
	 * through `random_password`, an extension point a credential should not have.
	 *
	 * @return WP_REST_Response|WP_Error The new secret, or a 500 or 501.
	 */
	public function rotate_secret() {
		// Where OpenSSL can verify keys, Reprint refuses secrets, so one issued here would go unused.
		if ( Utils::key_auth_required() ) {
			return new WP_Error(
				'jetpack_reprint_secret_auth_unsupported',
				__( 'This site verifies exports with public keys. Install a public key instead.', 'jetpack' ),
				array( 'status' => 501 )
			);
		}

		$secret = bin2hex( random_bytes( 32 ) );

		if ( ! Reprint_Exporter::store_secret( $secret ) ) {
			return new WP_Error(
				'jetpack_reprint_secret_not_stored',
				__( 'Failed to persist the new secret.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		// A leftover public key would revive if OpenSSL availability changed.
		delete_option( Reprint_Exporter::PUBLIC_KEY_OPTION );

		Reprint_Exporter::record_event( 'secret_rotated', array( 'user_id' => get_current_user_id() ) );

		return new WP_REST_Response(
			array(
				'secret'     => $secret,
				'export_url' => $this->export_url(),
			),
			200
		);
	}

	/**
	 * Replaces the enrolled public key and returns its key id.
	 *
	 * Reprint validates and canonicalizes the key, so the id matches the one the client derives.
	 *
	 * @param WP_REST_Request $request The request, carrying public_key.
	 * @return WP_REST_Response|WP_Error The key id, or a 400, 500 or 501.
	 */
	public function install_public_key( WP_REST_Request $request ) {
		if ( ! Utils::key_auth_required() ) {
			return new WP_Error(
				'jetpack_reprint_key_auth_unsupported',
				__( 'This site cannot verify public keys. Rotate the export secret instead.', 'jetpack' ),
				array( 'status' => 501 )
			);
		}

		try {
			$public_key = PublicKeyServer::assert_valid_public_key( (string) $request['public_key'] );
		} catch ( InvalidArgumentException $exception ) {
			return new WP_Error(
				'jetpack_reprint_invalid_public_key',
				$exception->getMessage(),
				array( 'status' => 400 )
			);
		}

		if ( ! Reprint_Exporter::store_public_key( $public_key ) ) {
			return new WP_Error(
				'jetpack_reprint_public_key_not_stored',
				__( 'Failed to persist the public key.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		delete_option( Reprint_Exporter::SECRET_OPTION );

		$key_id = Utils::public_key_fingerprint( $public_key );

		Reprint_Exporter::record_event(
			'public_key_installed',
			array(
				'user_id' => get_current_user_id(),
				'key_id'  => $key_id,
			)
		);

		return new WP_REST_Response(
			array(
				'key_id'     => $key_id,
				'export_url' => $this->export_url(),
			),
			200
		);
	}

	/**
	 * Permission callback: a Jetpack-signed request from a site administrator.
	 *
	 * Deliberately a role check, not a capability one. This installs a credential
	 * that streams the whole database and file tree, and no capability says
	 * that — `manage_options` is the closest, but plugins grant it to shop
	 * managers and the like.
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

		// Network administrator only: the export takes every table and everything
		// under ABSPATH, so a subsite administrator would leave with every other
		// site's users, content and uploads.
		if ( is_multisite() ) {
			return is_super_admin( $user->ID );
		}

		return in_array( 'administrator', $user->roles, true );
	}
}

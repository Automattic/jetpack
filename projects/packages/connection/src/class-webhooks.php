<?php
/**
 * Connection Webhooks class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Tracking;
use Jetpack_Options;

/**
 * Connection Webhooks class.
 */
class Webhooks {

	/**
	 * The Connection Manager object.
	 *
	 * @var Manager
	 */
	private $connection;

	/**
	 * Webhooks constructor.
	 *
	 * @param Manager $connection The Connection Manager object.
	 */
	public function __construct( $connection ) {
		$this->connection = $connection;
	}

	/**
	 * Initialize the webhooks.
	 *
	 * @param Manager $connection The Connection Manager object.
	 */
	public static function init( $connection ) {
		$webhooks = new static( $connection );

		add_action( 'init', array( $webhooks, 'controller' ) );
	}

	/**
	 * The "controller" decides which handler we need to run.
	 */
	public function controller() {
		// The nonce is verified in specific handlers.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( empty( $_GET['handler'] ) || empty( $_GET['action'] ) || 'jetpack-connection-webhooks' !== $_GET['handler'] ) {
			return;
		}

		// The nonce is verified in specific handlers.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		switch ( $_GET['action'] ) {
			case 'authorize':
				$this->handle_authorize();
				break;
		}

		$this->do_exit();
	}

	/**
	 * Perform the authorization action.
	 */
	public function handle_authorize() {
		if ( $this->connection->is_active() && $this->connection->is_user_connected() ) {
			$redirect_url = apply_filters( 'jetpack_client_authorize_already_authorized_url', admin_url() );
			wp_safe_redirect( $redirect_url );

			return;
		}
		do_action( 'jetpack_client_authorize_processing' );

		$data              = stripslashes_deep( $_GET );
		$data['auth_type'] = 'client';
		$roles             = new Roles();
		$role              = $roles->translate_current_user_to_role();
		$redirect          = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		check_admin_referer( "jetpack-authorize_{$role}_{$redirect}" );

		$tracking = new Tracking();

		$result = $this->connection->authorize( $data );

		if ( is_wp_error( $result ) ) {
			do_action( 'jetpack_client_authorize_error', $result );

			$tracking->record_user_event(
				'jpc_client_authorize_fail',
				array(
					'error_code'    => $result->get_error_code(),
					'error_message' => $result->get_error_message(),
				)
			);
		} else {
			/**
			 * Fires after the Jetpack client is authorized to communicate with WordPress.com.
			 *
			 * @param int Jetpack Blog ID.
			 *
			 * @since 4.2.0
			 */
			do_action( 'jetpack_client_authorized', Jetpack_Options::get_option( 'id' ) );

			$tracking->record_user_event( 'jpc_client_authorize_success' );
		}

		$fallback_redirect = apply_filters( 'jetpack_client_authorize_fallback_url', admin_url() );
		$redirect          = wp_validate_redirect( $redirect ) ? $redirect : $fallback_redirect;

		wp_safe_redirect( $redirect );
	}

	/**
	 * The `exit` is wrapped into a method so we could mock it.
	 */
	protected function do_exit() {
		exit;
	}
}
